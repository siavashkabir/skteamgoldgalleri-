"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSuperAdminContext } from "@/lib/admin-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isThemeColor } from "@/lib/theme-settings";

export type TenantActionState = {
  error?: string;
  success?: string;
};

export async function createTenant(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await getSuperAdminContext();

  const nameEntry = formData.get("name");
  const domainEntry = formData.get("domain");
  const theme = readThemeSettings(formData);
  const name = typeof nameEntry === "string" ? nameEntry.trim() : "";
  const domain = typeof domainEntry === "string" ? domainEntry.trim() : "";

  if (!name) {
    return { error: "نام فروشگاه را وارد کنید." };
  }
  if (name.length > 120) {
    return { error: "نام فروشگاه نباید بیشتر از ۱۲۰ نویسه باشد." };
  }
  if (domain.length > 253) {
    return { error: "نشانی دامنه نباید بیشتر از ۲۵۳ نویسه باشد." };
  }
  if (!theme) {
    return { error: "رنگ‌های پوسته فروشگاه معتبر نیستند." };
  }

  await db.execute({
    sql: "INSERT INTO tenants (id, name, domain, theme_settings) VALUES (?, ?, ?, ?)",
    args: [crypto.randomUUID(), name, domain || null, JSON.stringify(theme)],
  });

  revalidatePath("/master-admin");
  return { success: "فروشگاه جدید با موفقیت اضافه شد." };
}

export async function updateTenant(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await getSuperAdminContext();

  const idEntry = formData.get("id");
  const nameEntry = formData.get("name");
  const domainEntry = formData.get("domain");
  const logoUrl = readText(formData, "logo_url");
  const heroTitle = readText(formData, "hero_title");
  const heroSubtitle = readText(formData, "hero_subtitle");
  const phoneNumbers = readText(formData, "phone_numbers")
    .split(/\r?\n/)
    .map((phone) => phone.trim())
    .filter(Boolean);
  const addressText = readText(formData, "address_text");
  const locationUrl = readText(formData, "location_url");
  const instagramUrl = readText(formData, "instagram_url");
  const telegramUrl = readText(formData, "telegram_url");
  const whatsappUrl = readText(formData, "whatsapp_url");
  const tomanRateInput = readText(formData, "toman_rate");
  const tomanRate = tomanRateInput ? Number(tomanRateInput) : null;
  const theme = readThemeSettings(formData);
  const description = readText(formData, "description");
  const id = typeof idEntry === "string" ? idEntry.trim() : "";
  const name = typeof nameEntry === "string" ? nameEntry.trim() : "";
  const domain = typeof domainEntry === "string" ? domainEntry.trim() : "";

  if (!id) {
    return { error: "شناسه فروشگاه معتبر نیست." };
  }
  if (!name || name.length > 120) {
    return { error: "نام فروشگاه را وارد کنید (حداکثر ۱۲۰ نویسه)." };
  }
  if (!theme) {
    return { error: "رنگ‌های پوسته فروشگاه معتبر نیستند." };
  }
  if (
    domain.length > 253 ||
    (domain !== "" &&
      (!/^[a-zA-Z0-9.-]+$/.test(domain) ||
        domain.startsWith(".") ||
        domain.endsWith(".") ||
        domain.includes("..")))
  ) {
    return { error: "نام دامنه معتبر نیست؛ فقط نام میزبان را وارد کنید." };
  }
  for (const [label, value] of [
    ["لوگو", logoUrl],
    ["موقعیت مکانی", locationUrl],
    ["اینستاگرام", instagramUrl],
    ["تلگرام", telegramUrl],
    ["واتساپ", whatsappUrl],
  ]) {
    if (value && !isHttpUrl(value)) {
      return { error: `نشانی ${label} باید با http یا https شروع شود.` };
    }
  }
  if (
    heroTitle.length > 200 ||
    heroSubtitle.length > 1000 ||
    description.length > 5000 ||
    addressText.length > 1000 ||
    phoneNumbers.length > 10 ||
    phoneNumbers.some((phone) => phone.length > 40) ||
    (tomanRate !== null && (!Number.isFinite(tomanRate) || tomanRate <= 0))
  ) {
    return { error: "مقادیر تنظیمات فروشگاه معتبر نیستند." };
  }

  const result = await db.execute({
    sql: `UPDATE tenants SET name = ?, domain = ?, description = ?, logo_url = ?, hero_title = ?,
          hero_subtitle = ?, phone_numbers = ?, address_text = ?, location_url = ?,
          instagram_url = ?, telegram_url = ?, whatsapp_url = ?, social_links = ?,
          toman_rate = ?, theme_settings = ? WHERE id = ?`,
    args: [
      name,
      domain || null,
      description || null,
      logoUrl || null,
      heroTitle || null,
      heroSubtitle || null,
      JSON.stringify(phoneNumbers),
      addressText || null,
      locationUrl || null,
      instagramUrl || null,
      telegramUrl || null,
      whatsappUrl || null,
      JSON.stringify({
        instagram: instagramUrl,
        telegram: telegramUrl,
        whatsapp: whatsappUrl,
      }),
      tomanRate,
      JSON.stringify(theme),
      id,
    ],
  });
  if (result.rowsAffected === 0) {
    return { error: "فروشگاه پیدا نشد." };
  }

  revalidatePath("/master-admin");
  revalidatePath("/", "layout");
  return { success: "اطلاعات فروشگاه ذخیره شد." };
}

export async function savePlatformSettings(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await getSuperAdminContext();
  const name = readText(formData, "platform_name");
  const url = readText(formData, "platform_url");
  if (!name || name.length > 100) {
    return { error: "نام پلتفرم را وارد کنید (حداکثر ۱۰۰ نویسه)." };
  }
  if (url && !isHttpUrl(url)) {
    return { error: "نشانی پلتفرم باید یک URL معتبر با http یا https باشد." };
  }
  await db.batch(
    [
      {
        sql: `INSERT INTO platform_settings (key, value) VALUES ('platform_name', ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [name],
      },
      {
        sql: `INSERT INTO platform_settings (key, value) VALUES ('platform_url', ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [url],
      },
    ],
    "write",
  );
  revalidatePath("/master-admin");
  revalidatePath("/", "layout");
  return { success: "تنظیمات برند پلتفرم ذخیره شد." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  redirect("/login");
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readThemeSettings(formData: FormData) {
  const primary = readText(formData, "theme_primary");
  const background = readText(formData, "theme_background");
  const text = readText(formData, "theme_text");
  if (
    !isThemeColor(primary) ||
    !isThemeColor(background) ||
    !isThemeColor(text)
  ) {
    return null;
  }
  return { primary, background, text };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
