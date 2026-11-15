"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSuperAdminContext } from "@/lib/admin-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { setImpersonatedTenant, clearImpersonatedTenant } from "@/lib/admin-impersonation";
import {
  isThemeColor,
  type ThemeSettings,
} from "@/lib/theme-settings";
import {
  TENANT_MODULES,
  type TenantModule,
} from "@/lib/tenant-modules";

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
  const ownerEmail = readText(formData, "owner_email").toLowerCase();
  const templateId = readTemplateId(formData);
  const businessType = readText(formData, "business_type");
  const enabledModules = readTenantModules(formData);
  const status = readTenantStatus(formData);
  const expiryDate = readExpiryDate(formData);
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
  if (!isEmail(ownerEmail)) {
    return { error: "ایمیل مالک فروشگاه معتبر نیست." };
  }
  const existingOwner = await db.execute({
    sql: "SELECT 1 FROM tenants WHERE lower(trim(owner_email)) = ? LIMIT 1",
    args: [ownerEmail],
  });
  if (existingOwner.rows.length) {
    return { error: "این ایمیل قبلاً مالک یک فروشگاه ثبت شده است." };
  }
  if (await isCustomerEmail(ownerEmail)) {
    return { error: "این ایمیل به حساب مشتری تعلق دارد؛ برای مالک فروشگاه از یک حساب مدیریتی استفاده کنید." };
  }
  if (!templateId || !status || expiryDate === false) {
    return { error: "قالب یا وضعیت اشتراک معتبر نیست." };
  }
  if (!enabledModules || businessType.length > 120) {
    return { error: "نوع کسب‌وکار یا ماژول‌های انتخاب‌شده معتبر نیستند." };
  }
  const logoResult = await uploadTenantLogo(formData, id);
  if (logoResult.error) return { error: logoResult.error };
  const fontResult = await uploadTenantFont(formData, id);
  if (fontResult.error) return { error: fontResult.error };
  const kycData = readInitialKyc(formData);
  if (!kycData) {
    return { error: "اطلاعات اولیه احراز هویت معتبر نیست." };
  }
  const themeResult = await readThemeSettings(formData, id);
  if (!themeResult.theme) {
    return { error: themeResult.error ?? "تنظیمات پوسته فروشگاه معتبر نیستند." };
  }

  await db.execute({
    sql: `INSERT INTO tenants
            (id, name, domain, owner_email, business_type, template_id,
             enabled_modules, kyc_data, logo_url, custom_font_url, status, expiry_date, theme_settings)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      name,
      domain || null,
      ownerEmail,
      businessType || null,
      templateId,
      JSON.stringify(enabledModules),
      JSON.stringify(kycData),
      logoResult.url,
      fontResult.url,
      status,
      expiryDate || null,
      JSON.stringify(themeResult.theme),
    ],
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
  const ownerEmail = readText(formData, "owner_email").toLowerCase();
  const templateId = readTemplateId(formData);
  const businessType = readText(formData, "business_type");
  const enabledModules = readTenantModules(formData);
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
  if (!isEmail(ownerEmail)) {
    return { error: "ایمیل مالک فروشگاه معتبر نیست." };
  }
  const existingOwner = await db.execute({
    sql: `SELECT 1 FROM tenants
          WHERE lower(trim(owner_email)) = ? AND id <> ? LIMIT 1`,
    args: [ownerEmail, id],
  });
  if (existingOwner.rows.length) {
    return { error: "این ایمیل قبلاً مالک یک فروشگاه دیگر است." };
  }
  if (await isCustomerEmail(ownerEmail)) {
    return { error: "این ایمیل به حساب مشتری تعلق دارد؛ برای مالک فروشگاه از یک حساب مدیریتی استفاده کنید." };
  }
  if (!templateId) {
    return { error: "قالب فروشگاه معتبر نیست." };
  }
  if (!enabledModules || businessType.length > 120) {
    return { error: "نوع کسب‌وکار یا ماژول‌های انتخاب‌شده معتبر نیستند." };
  }
  const initialKyc = readInitialKyc(formData);
  if (!initialKyc) {
    return { error: "اطلاعات احراز هویت معتبر نیست." };
  }
  const logoResult = await uploadTenantLogo(formData, id);
  if (logoResult.error) return { error: logoResult.error };
  const finalLogoUrl = logoResult.url ?? logoUrl;
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
    ["لوگو", finalLogoUrl],
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
    sql: `UPDATE tenants SET name = ?, domain = ?, owner_email = ?, business_type = ?,
          enabled_modules = ?, kyc_data = ?, template_id = ?,
          description = ?, logo_url = ?, hero_title = ?,
          hero_subtitle = ?, phone_numbers = ?, address_text = ?, location_url = ?,
          instagram_url = ?, telegram_url = ?, whatsapp_url = ?, social_links = ?,
          toman_rate = ?, theme_settings = ?, status = ?, expiry_date = ? WHERE id = ?`,
    args: [
      name,
      domain || null,
      ownerEmail,
      businessType || null,
      JSON.stringify(enabledModules),
      JSON.stringify(initialKyc),
      templateId,
      description || null,
      finalLogoUrl || null,
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

export async function impersonateTenant(formData: FormData): Promise<never> {
  await getSuperAdminContext();
  const tenantId = readText(formData, "tenant_id");
  if (!tenantId) {
    throw new Error("شناسه فروشگاه معتبر نیست.");
  }
  const tenant = await db.execute({
    sql: "SELECT id FROM tenants WHERE id = ?",
    args: [tenantId],
  });
  if (!tenant.rows.length) {
    throw new Error("فروشگاه پیدا نشد.");
  }
  await setImpersonatedTenant(tenantId);
  redirect("/admin");
}

export async function stopImpersonatingTenant(): Promise<never> {
  await getSuperAdminContext();
  await clearImpersonatedTenant();
  redirect("/master-admin");
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
  await clearImpersonatedTenant();
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

function readTemplateId(
  formData: FormData,
): "luxury" | "minimal" | "classic" | "medical" | "tourism" | "corporate" | null {
  const templateId = readText(formData, "template_id");
  return templateId === "luxury" ||
    templateId === "minimal" ||
    templateId === "classic" ||
    templateId === "medical" ||
    templateId === "tourism" ||
    templateId === "corporate"
    ? templateId
    : null;
}

function readTenantModules(formData: FormData): TenantModule[] | null {
  const values = formData.getAll("enabled_modules");
  if (
    !values.every(
      (value): value is string =>
        typeof value === "string" &&
        TENANT_MODULES.includes(value as TenantModule),
    )
  ) {
    return null;
  }
  return [...new Set(values)] as TenantModule[];
}

function readInitialKyc(formData: FormData): Record<string, string> | null {
  const values = {
    full_name: readText(formData, "kyc_full_name"),
    national_id: readText(formData, "kyc_national_id"),
    address: readText(formData, "kyc_address"),
    phone: readText(formData, "kyc_phone"),
  };
  if (
    Object.values(values).some((value) => value.length > 1000) ||
    (values.phone && values.phone.length > 40) ||
    (values.national_id && values.national_id.length > 30)
  ) {
    return null;
  }
  return values;
}

async function uploadTenantLogo(
  formData: FormData,
  tenantId: string,
): Promise<{ url: string | null; error?: string }> {
  const file = formData.get("logo_file");
  if (!(file instanceof File) || file.size === 0) {
    const url = readText(formData, "logo_url");
    if (url && !isHttpUrl(url)) {
      return { url: null, error: "نشانی لوگو باید با http یا https شروع شود." };
    }
    return { url: url || null };
  }
  const extensions = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/avif", "avif"],
  ]);
  const extension = extensions.get(file.type);
  if (!extension || file.size > 5 * 1024 * 1024) {
    return { url: null, error: "لوگو باید تصویر JPEG، PNG، WebP یا AVIF و حداکثر ۵ مگابایت باشد." };
  }
  const supabase = await getSupabaseAdminClient();
  const { data: bucket, error: bucketError } =
    await supabase.storage.getBucket("products");
  if (bucketError) {
    throw new Error(`باکت products در Supabase Storage در دسترس نیست: ${bucketError.message}`);
  }
  if (!bucket.public) {
    throw new Error("برای نمایش لوگوی فروشگاه، باکت products باید عمومی باشد.");
  }
  const { data, error } = await supabase.storage
    .from("products")
    .upload(`${tenantId}/logos/${crypto.randomUUID()}.${extension}`, file, {
      contentType: file.type,
      upsert: false,
    });
  if (error) {
    throw new Error(`بارگذاری لوگو انجام نشد: ${error.message}`);
  }
  return {
    url: supabase.storage.from("products").getPublicUrl(data.path).data.publicUrl,
  };
}

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function isCustomerEmail(email: string): Promise<boolean> {
  const result = await db.execute({
    sql: "SELECT 1 FROM profiles WHERE lower(trim(email)) = ? AND role = 'customer' LIMIT 1",
    args: [email],
  });
  return result.rows.length > 0;
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

async function uploadTenantFont(formData: FormData, tenantId: string) {
  const file = formData.get("custom_font_file") as File | null;
  if (!file || file.size === 0) return { url: null, error: null };
  if (file.size > 5 * 1024 * 1024) return { url: null, error: "حجم فونت نباید بیشتر از ۵ مگابایت باشد." };

  try {
    const { getSupabaseAdminClient } = await import("@/lib/supabase");
    const supabase = await getSupabaseAdminClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `font-${tenantId}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file, { upsert: true });
      
    if (uploadError) return { url: null, error: "خطا در آپلود فونت" };
    
    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: "خطای غیرمنتظره در آپلود فونت" };
  }
}
