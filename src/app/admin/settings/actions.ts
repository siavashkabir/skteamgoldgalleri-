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
  const name = readText(formData, "name");
  const description = readText(formData, "description");
  const domain = readText(formData, "domain");
  const instagramUrl = readText(formData, "instagram_url");
  const telegramUrl = readText(formData, "telegram_url");
  const whatsappUrl = readText(formData, "whatsapp_url");
  const logoUrl = readText(formData, "logo_url");
  const heroTitle = readText(formData, "hero_title");
  const heroSubtitle = readText(formData, "hero_subtitle");
  const phoneNumbers = readText(formData, "phone_numbers")
    .split(/\r?\n/)
    .map((phone) => phone.trim())
    .filter(Boolean);
  const addressText = readText(formData, "address_text");
  const locationUrl = readText(formData, "location_url");
  const tomanRateInput = readText(formData, "toman_rate");
  const tomanRate = tomanRateInput ? Number(tomanRateInput) : null;

  if (!name || name.length > 120) {
    return { error: "نام فروشگاه را وارد کنید (حداکثر ۱۲۰ نویسه)." };
  }
  if (description.length > 5000) {
    return { error: "توضیحات نباید بیشتر از ۵۰۰۰ نویسه باشد." };
  }
  if (domain.length > 253) {
    return { error: "دامنه نباید بیشتر از ۲۵۳ نویسه باشد." };
  }
  if (logoUrl && !isHttpUrl(logoUrl)) {
    return { error: "نشانی لوگو باید با http یا https شروع شود." };
  }
  if (locationUrl && !isHttpUrl(locationUrl)) {
    return { error: "نشانی موقعیت مکانی باید با http یا https شروع شود." };
  }
  if (heroTitle.length > 200 || heroSubtitle.length > 1000) {
    return { error: "عنوان یا زیرعنوان ویترین بیش از حد طولانی است." };
  }
  if (addressText.length > 1000 || phoneNumbers.length > 10) {
    return { error: "نشانی یا تعداد شماره‌های تماس معتبر نیست." };
  }
  if (
    phoneNumbers.some((phone) => phone.length > 40) ||
    (tomanRate !== null && (!Number.isFinite(tomanRate) || tomanRate <= 0))
  ) {
    return { error: "شماره تماس یا نرخ دستی دلار معتبر نیست." };
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
          SET name = ?, description = ?, domain = ?, instagram_url = ?,
              telegram_url = ?, whatsapp_url = ?, logo_url = ?, hero_title = ?,
              hero_subtitle = ?, phone_numbers = ?, address_text = ?,
              location_url = ?, social_links = ?, toman_rate = ?
          WHERE id = ?`,
    args: [
      name,
      description || null,
      domain || null,
      instagramUrl || null,
      telegramUrl || null,
      whatsappUrl || null,
      logoUrl || null,
      heroTitle || null,
      heroSubtitle || null,
      JSON.stringify(phoneNumbers),
      addressText || null,
      locationUrl || null,
      JSON.stringify({
        instagram: instagramUrl,
        telegram: telegramUrl,
        whatsapp: whatsappUrl,
      }),
      tomanRate,
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
