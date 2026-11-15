"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantAdminContext } from "@/lib/admin-context";
import type { AdminActionState } from "../action-state";

export async function saveStoreSettings(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { tenantId } = await getTenantAdminContext();
  const instagramUrl = readText(formData, "instagram_url");
  const telegramUrl = readText(formData, "telegram_url");
  const whatsappUrl = readText(formData, "whatsapp_url");
  const phoneNumbers = readText(formData, "phone_numbers")
    .split(/\r?\n/)
    .map((phone) => phone.trim())
    .filter(Boolean);
  const addressText = readText(formData, "address_text");
  const locationUrl = readText(formData, "location_url");

  if (locationUrl && !isHttpUrl(locationUrl)) {
    return { error: "نشانی موقعیت مکانی باید با http یا https شروع شود." };
  }
  if (addressText.length > 1000 || phoneNumbers.length > 10) {
    return { error: "نشانی یا تعداد شماره‌های تماس معتبر نیست." };
  }
  if (phoneNumbers.some((phone) => phone.length > 40)) {
    return { error: "شماره تماس معتبر نیست." };
  }

  for (const [label, value] of [
    ["اینستاگرام", instagramUrl],
    ["تلگرام", telegramUrl],
    ["واتساپ", whatsappUrl],
  ]) {
    if (value && !isHttpUrl(value)) {
      return { error: `نشانی ${label} باید با http یا https شروع شود.` };
    }
  }

  await db.execute({
    sql: `UPDATE tenants
          SET instagram_url = ?, telegram_url = ?, whatsapp_url = ?,
              phone_numbers = ?, address_text = ?, location_url = ?, social_links = ?
          WHERE id = ?`,
    args: [
      instagramUrl || null,
      telegramUrl || null,
      whatsappUrl || null,
      JSON.stringify(phoneNumbers),
      addressText || null,
      locationUrl || null,
      JSON.stringify({
        instagram: instagramUrl,
        telegram: telegramUrl,
        whatsapp: whatsappUrl,
      }),
      tenantId,
    ],
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  return { success: "تنظیمات فروشگاه ذخیره شد." };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
