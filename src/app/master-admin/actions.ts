"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSuperAdminContext } from "@/lib/admin-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import {
  isThemeColor,
  type ThemeSettings,
} from "@/lib/theme-settings";

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
  const name = typeof nameEntry === "string" ? nameEntry.trim() : "";
  const domain = typeof domainEntry === "string" ? domainEntry.trim() : "";
  const id = crypto.randomUUID();

  if (!name) {
    return { error: "نام فروشگاه را وارد کنید." };
  }
  if (name.length > 120) {
    return { error: "نام فروشگاه نباید بیشتر از ۱۲۰ نویسه باشد." };
  }
  if (domain.length > 253) {
    return { error: "نشانی دامنه نباید بیشتر از ۲۵۳ نویسه باشد." };
  }
  const themeResult = await readThemeSettings(formData, id);
  if (!themeResult.theme) {
    return { error: themeResult.error ?? "تنظیمات پوسته فروشگاه معتبر نیستند." };
  }

  await db.execute({
    sql: "INSERT INTO tenants (id, name, domain, theme_settings) VALUES (?, ?, ?, ?)",
    args: [id, name, domain || null, JSON.stringify(themeResult.theme)],
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
  const status = readTenantStatus(formData);
  const expiryDate = readExpiryDate(formData);
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
  if (!status || expiryDate === false) {
    return { error: "وضعیت یا تاریخ پایان اشتراک معتبر نیست." };
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

  const themeResult = await readThemeSettings(formData, id);
  if (!themeResult.theme) {
    return { error: themeResult.error ?? "تنظیمات پوسته فروشگاه معتبر نیستند." };
  }

  const result = await db.execute({
    sql: `UPDATE tenants SET name = ?, domain = ?, description = ?, logo_url = ?, hero_title = ?,
          hero_subtitle = ?, phone_numbers = ?, address_text = ?, location_url = ?,
          instagram_url = ?, telegram_url = ?, whatsapp_url = ?, social_links = ?,
          toman_rate = ?, theme_settings = ?, status = ?, expiry_date = ? WHERE id = ?`,
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
      JSON.stringify(themeResult.theme),
      status,
      expiryDate || null,
      id,
    ],
  });
  if (result.rowsAffected === 0) {
    return { error: "فروشگاه پیدا نشد." };
  }

  revalidatePath("/master-admin");
  revalidatePath("/", "layout");
  revalidatePath("/[tenant_slug]", "page");
  return { success: "اطلاعات فروشگاه ذخیره شد." };
}

export async function saveGlobalBanner(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await getSuperAdminContext();
  const bannerText = readText(formData, "banner_text");
  if (bannerText.length > 500) {
    return { error: "متن بنر نباید بیشتر از ۵۰۰ نویسه باشد." };
  }
  await db.execute({
    sql: `INSERT INTO master_settings (id, banner_text) VALUES ('global', ?)
          ON CONFLICT(id) DO UPDATE SET banner_text = excluded.banner_text`,
    args: [bannerText],
  });
  revalidatePath("/master-admin");
  revalidatePath("/", "layout");
  return { success: "بنر سراسری ذخیره شد." };
}

export async function saveMasterTool(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await getSuperAdminContext();
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const url = readText(formData, "url");
  const icon = readText(formData, "icon");
  const orderInput = readText(formData, "order");
  const order = orderInput ? Number(orderInput) : 0;
  if (!name || name.length > 100) {
    return { error: "نام ابزار را وارد کنید (حداکثر ۱۰۰ نویسه)." };
  }
  if (!isHttpUrl(url)) {
    return { error: "نشانی ابزار باید یک URL معتبر با http یا https باشد." };
  }
  if (!icon || icon.length > 20 || !Number.isInteger(order) || order < 0) {
    return { error: "آیکن یا ترتیب نمایش معتبر نیست." };
  }

  if (id) {
    const result = await db.execute({
      sql: `UPDATE master_tools SET name = ?, url = ?, icon = ?, "order" = ?
            WHERE id = ?`,
      args: [name, url, icon, order, id],
    });
    if (result.rowsAffected === 0) {
      return { error: "ابزار پیدا نشد." };
    }
  } else {
    await db.execute({
      sql: `INSERT INTO master_tools (id, name, url, icon, "order")
            VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), name, url, icon, order],
    });
  }
  revalidatePath("/master-admin");
  revalidatePath("/master-admin/tools");
  return { success: "ابزار ذخیره شد." };
}

export async function deleteMasterTool(formData: FormData): Promise<void> {
  await getSuperAdminContext();
  const id = readText(formData, "id");
  if (!id) {
    throw new Error("شناسه ابزار معتبر نیست.");
  }
  const result = await db.execute({
    sql: "DELETE FROM master_tools WHERE id = ?",
    args: [id],
  });
  if (result.rowsAffected === 0) {
    throw new Error("ابزار پیدا نشد.");
  }
  revalidatePath("/master-admin");
  revalidatePath("/master-admin/tools");
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

async function readThemeSettings(
  formData: FormData,
  tenantId: unknown,
): Promise<{ theme: ThemeSettings | null; error?: string }> {
  const primary = readText(formData, "theme_primary");
  const background = readText(formData, "theme_background");
  const text = readText(formData, "theme_text");
  const accent = readText(formData, "theme_accent");
  const card = readText(formData, "theme_card");
  const existingImage = readText(formData, "theme_bg_image_url");
  const opacity = Number(readText(formData, "theme_bg_opacity"));
  const image = formData.get("theme_bg_image");
  if (
    !isThemeColor(primary) ||
    !isThemeColor(background) ||
    !isThemeColor(text) ||
    !isThemeColor(accent) ||
    !isThemeColor(card) ||
    !Number.isInteger(opacity) ||
    opacity < 0 ||
    opacity > 100
  ) {
    return { theme: null };
  }
  let bgImageUrl = existingImage || null;
  if (formData.get("theme_bg_image_clear") === "on") {
    bgImageUrl = null;
  }
  if (image instanceof File && image.size > 0) {
    const extensions = new Map([
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/webp", "webp"],
      ["image/avif", "avif"],
    ]);
    const extension = extensions.get(image.type);
    if (!extension || image.size > 5 * 1024 * 1024) {
      return { theme: null, error: "تصویر پس‌زمینه باید JPEG، PNG، WebP یا AVIF و حداکثر ۵ مگابایت باشد." };
    }
    if (typeof tenantId !== "string" || !tenantId.trim()) {
      return { theme: null, error: "شناسه فروشگاه معتبر نیست." };
    }
    const supabase = await getSupabaseAdminClient();
    const { data: bucket, error: bucketError } =
      await supabase.storage.getBucket("products");
    if (bucketError) {
      throw new Error(`باکت products در Supabase Storage در دسترس نیست: ${bucketError.message}`);
    }
    if (!bucket.public) {
      throw new Error("برای نمایش تصویر پس‌زمینه، باکت products باید عمومی باشد.");
    }
    const { data, error } = await supabase.storage
      .from("products")
      .upload(`${tenantId}/backgrounds/${crypto.randomUUID()}.${extension}`, image, {
        contentType: image.type,
        upsert: false,
      });
    if (error) {
      throw new Error(`بارگذاری تصویر پس‌زمینه انجام نشد: ${error.message}`);
    }
    bgImageUrl = supabase.storage.from("products").getPublicUrl(data.path).data.publicUrl;
  } else if (existingImage && !isHttpUrl(existingImage)) {
    return { theme: null };
  }
  return {
    theme: { primary, background, text, accent, card, bgImageUrl, bgOpacity: opacity },
  };
}

function readTenantStatus(
  formData: FormData,
): "active" | "trial" | "suspended" | null {
  const status = readText(formData, "status");
  return status === "active" || status === "trial" || status === "suspended"
    ? status
    : null;
}

function readExpiryDate(formData: FormData): string | null | false {
  const value = readText(formData, "expiry_date");
  if (!value) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
    ? value
    : false;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
