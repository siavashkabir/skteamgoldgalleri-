"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantAdminContext } from "@/lib/admin-context";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { AdminActionState } from "./action-state";

const licenseTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function completeTenantOnboarding(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { tenantId, role } = await getTenantAdminContext({
    allowIncompleteProfile: true,
  });
  if (role !== "tenant_admin") {
    return { error: "این فرم فقط برای مدیر فروشگاه است." };
  }
  const fullName = readText(formData, "full_name");
  const nationalId = readText(formData, "national_id");
  const address = readText(formData, "address");
  const phone = readText(formData, "phone");
  const businessType = readText(formData, "business_type");
  const agreed = formData.get("legal_agreed") === "on";
  if (
    fullName.length < 2 ||
    fullName.length > 120 ||
    nationalId.length < 5 ||
    nationalId.length > 30 ||
    address.length < 5 ||
    address.length > 1000 ||
    phone.length < 5 ||
    phone.length > 40 ||
    businessType.length > 120
  ) {
    return { error: "همه اطلاعات هویتی و نشانی را به‌درستی تکمیل کنید." };
  }
  if (!agreed) {
    return { error: "برای ادامه، پذیرش توافق‌نامه الزامی است." };
  }

  let licenseUrl: string | null = null;
  const license = formData.get("license");
  if (license instanceof File && license.size > 0) {
    if (!licenseTypes.has(license.type) || license.size > 5 * 1024 * 1024) {
      return {
        error: "مجوز باید PDF یا تصویر JPEG، PNG، WebP و حداکثر ۵ مگابایت باشد.",
      };
    }
    const extension = license.type === "application/pdf"
      ? "pdf"
      : license.type.slice("image/".length);
    const supabase = await getSupabaseAdminClient();
    const { data: bucket, error: bucketError } =
      await supabase.storage.getBucket("licenses");
    if (bucketError) {
      throw new Error(`باکت licenses در Supabase Storage در دسترس نیست: ${bucketError.message}`);
    }
    if (bucket.public) {
      throw new Error("باکت licenses باید خصوصی باشد.");
    }
    const path = `${tenantId}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage
      .from("licenses")
      .upload(path, license, {
        contentType: license.type,
        upsert: false,
      });
    if (error) {
      throw new Error(`بارگذاری مجوز انجام نشد: ${error.message}`);
    }
    licenseUrl = data.path;
  }

  await db.execute({
    sql: `UPDATE tenants
          SET business_type = COALESCE(?, business_type), kyc_data = ?,
              license_url = COALESCE(?, license_url),
              legal_agreed_at = datetime('now')
          WHERE id = ?`,
    args: [
      businessType || null,
      JSON.stringify({ full_name: fullName, national_id: nationalId, address, phone }),
      licenseUrl,
      tenantId,
    ],
  });
  revalidatePath("/admin");
  return { success: "اطلاعات شما با موفقیت ثبت شد." };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
