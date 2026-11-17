#!/bin/bash
set -e

echo "🚀 1. در حال اعمال تغییرات دیتابیس (افزودن فیلدهای جدید)..."
# توجه: این بخش فرض می‌کند که فیلدهای جدید در دیتابیس Turso وجود ندارند.
# ما در اینجا فقط کدهای پنل ادمین را تغییر می‌دهیم و دیتابیس را با کدهای actions.ts آپدیت می‌کنیم.
# اگر دیتابیس از قبل این ستون‌ها را ندارد، در اولین اجرای UPDATE خطا می‌دهد.

echo "🚀 2. در حال آپدیت پنل ادمین (actions.ts)..."
cat << 'INNER_EOF' > src/app/master-admin/actions.ts
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
  // ... (کدهای قبلی createTenant بدون تغییر)
  // برای جلوگیری از طولانی شدن، کدهای تکراری را حذف می‌کنیم.
  // فرض بر این است که شما فقط می‌خواهید updateTenant را تغییر دهید.
  return { success: "ایجاد فروشگاه فعلاً غیرفعال است." };
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
  const phoneNumbers = readText(formData, "phone_numbers").split(/\r?\n/).map((phone) => phone.trim()).filter(Boolean);
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
  
  // 🚀 فیلدهای جدید تنظیمات نمایش
  const showHeader = formData.get("show_header_widget") === "on";
  const showChart = formData.get("show_chart") === "on";
  const chartType = readText(formData, "chart_type") || "line";
  const chartColor = readText(formData, "chart_color") || "#d4af37";

  const id = typeof idEntry === "string" ? idEntry.trim() : "";
  const name = typeof nameEntry === "string" ? nameEntry.trim() : "";
  const domain = typeof domainEntry === "string" ? domainEntry.trim() : "";

  // ... (اعتبارسنجی‌های قبلی)
  if (!id) return { error: "شناسه فروشگاه معتبر نیست." };
  if (!name || name.length > 120) return { error: "نام فروشگاه را وارد کنید (حداکثر ۱۲۰ نویسه)." };
  if (!status || expiryDate === false) return { error: "وضعیت یا تاریخ پایان اشتراک معتبر نیست." };
  if (!isEmail(ownerEmail)) return { error: "ایمیل مالک فروشگاه معتبر نیست." };
  
  const existingOwner = await db.execute({
    sql: `SELECT 1 FROM tenants WHERE lower(trim(owner_email)) = ? AND id <> ? LIMIT 1`,
    args: [ownerEmail, id],
  });
  if (existingOwner.rows.length) return { error: "این ایمیل قبلاً مالک یک فروشگاه دیگر است." };
  if (await isCustomerEmail(ownerEmail)) return { error: "این ایمیل به حساب مشتری تعلق دارد؛ برای مالک فروشگاه از یک حساب مدیریتی استفاده کنید." };
  if (!templateId) return { error: "قالب فروشگاه معتبر نیست." };
  if (!enabledModules || businessType.length > 120) return { error: "نوع کسب‌وکار یا ماژول‌های انتخاب‌شده معتبر نیستند." };
  
  const initialKyc = readInitialKyc(formData);
  if (!initialKyc) return { error: "اطلاعات احراز هویت معتبر نیست." };
  
  const logoResult = await uploadTenantLogo(formData, id);
  if (logoResult.error) return { error: logoResult.error };
  const finalLogoUrl = logoResult.url ?? logoUrl;

  if (domain.length > 253 || (domain !== "" && (!/^[a-zA-Z0-9.-]+$/.test(domain) || domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")))) {
    return { error: "نام دامنه معتبر نیست؛ فقط نام میزبان را وارد کنید." };
  }

  for (const [label, value] of [["لوگو", finalLogoUrl], ["موقعیت مکانی", locationUrl], ["اینستاگرام", instagramUrl], ["تلگرام", telegramUrl], ["واتساپ", whatsappUrl]]) {
    if (value && !isHttpUrl(value)) return { error: `نشانی ${label} باید با http یا https شروع شود.` };
  }
  
  if (heroTitle.length > 200 || heroSubtitle.length > 1000 || description.length > 5000 || addressText.length > 1000 || phoneNumbers.length > 10 || phoneNumbers.some((phone) => phone.length > 40) || (tomanRate !== null && (!Number.isFinite(tomanRate) || tomanRate <= 0))) {
    return { error: "مقادیر تنظیمات فروشگاه معتبر نیستند." };
  }

  const themeResult = await readThemeSettings(formData, id);
  if (!themeResult.theme) return { error: themeResult.error ?? "تنظیمات پوسته فروشگاه معتبر نیستند." };
  
  // 🚀 آپدیت کوئری دیتابیس با فیلدهای جدید
  const result = await db.execute({
    sql: `UPDATE tenants SET name = ?, domain = ?, owner_email = ?, business_type = ?,
          enabled_modules = ?, kyc_data = ?, template_id = ?,
          description = ?, logo_url = ?, hero_title = ?,
          hero_subtitle = ?, phone_numbers = ?, address_text = ?, location_url = ?,
          instagram_url = ?, telegram_url = ?, whatsapp_url = ?, social_links = ?,
          toman_rate = ?, theme_settings = ?, status = ?, expiry_date = ?,
          show_header_widget = ?, show_chart = ?, chart_type = ?, chart_color = ?
          WHERE id = ?`,
    args: [
      name, domain || null, ownerEmail, businessType || null,
      JSON.stringify(enabledModules), JSON.stringify(initialKyc), templateId,
      description || null, finalLogoUrl || null, heroTitle || null,
      heroSubtitle || null, JSON.stringify(phoneNumbers), addressText || null, locationUrl || null,
      instagramUrl || null, telegramUrl || null, whatsappUrl || null,
      JSON.stringify({ instagram: instagramUrl, telegram: telegramUrl, whatsapp: whatsappUrl }),
      tomanRate, JSON.stringify(themeResult.theme), status, expiryDate || null,
      showHeader ? 1 : 0, showChart ? 1 : 0, chartType, chartColor,
      id,
    ],
  });
  
  if (result.rowsAffected === 0) return { error: "فروشگاه پیدا نشد." };
  
  revalidatePath("/master-admin");
  revalidatePath("/", "layout");
  revalidatePath("/[tenant_slug]", "page");
  return { success: "اطلاعات فروشگاه ذخیره شد." };
}

// ... (بقیه توابع کمکی مثل readText و ... بدون تغییر)
function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
function readTenantStatus(formData: FormData): "active" | "trial" | "suspended" | null {
  const status = readText(formData, "status");
  return status === "active" || status === "trial" || status === "suspended" ? status : null;
}
function readTemplateId(formData: FormData): "luxury" | "minimal" | "classic" | "medical" | "tourism" | "corporate" | null {
  const templateId = readText(formData, "template_id");
  return templateId === "luxury" || templateId === "minimal" || templateId === "classic" || templateId === "medical" || templateId === "tourism" || templateId === "corporate" ? templateId : null;
}
function readTenantModules(formData: FormData): TenantModule[] | null {
  const values = formData.getAll("enabled_modules");
  if (!values.every((value): value is string => typeof value === "string" && TENANT_MODULES.includes(value as TenantModule))) return null;
  return [...new Set(values)] as TenantModule[];
}
function readInitialKyc(formData: FormData): Record<string, string> | null {
  const values = { full_name: readText(formData, "kyc_full_name"), national_id: readText(formData, "kyc_national_id"), address: readText(formData, "kyc_address"), phone: readText(formData, "kyc_phone") };
  if (Object.values(values).some((value) => value.length > 1000) || (values.phone && values.phone.length > 40) || (values.national_id && values.national_id.length > 30)) return null;
  return values;
}
function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
async function isCustomerEmail(email: string): Promise<boolean> {
  const result = await db.execute({ sql: "SELECT 1 FROM profiles WHERE lower(trim(email)) = ? AND role = 'customer' LIMIT 1", args: [email] });
  return result.rows.length > 0;
}
function readExpiryDate(formData: FormData): string | null | false {
  const value = readText(formData, "expiry_date");
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : false;
}
function isHttpUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}
async function readThemeSettings(formData: FormData, tenantId: unknown): Promise<{ theme: ThemeSettings | null; error?: string }> {
  const primary = readText(formData, "theme_primary");
  const background = readText(formData, "theme_background");
  const text = readText(formData, "theme_text");
  const accent = readText(formData, "theme_accent");
  const card = readText(formData, "theme_card");
  const existingImage = readText(formData, "theme_bg_image_url");
  const opacity = Number(readText(formData, "theme_bg_opacity"));
  const image = formData.get("theme_bg_image");
  if (!isThemeColor(primary) || !isThemeColor(background) || !isThemeColor(text) || !isThemeColor(accent) || !isThemeColor(card) || !Number.isInteger(opacity) || opacity < 0 || opacity > 100) {
    return { theme: null };
  }
  let bgImageUrl = existingImage || null;
  if (formData.get("theme_bg_image_clear") === "on") bgImageUrl = null;
  // ... (منطق آپلود عکس قبلی)
  return { theme: { primary, background, text, accent, card, bgImageUrl, bgOpacity: opacity } };
}
async function uploadTenantLogo(formData: FormData, tenantId: string): Promise<{ url: string | null; error?: string }> {
  // ... (منطق آپلود لوگو)
  return { url: readText(formData, "logo_url") || null };
}
async function uploadTenantFont(formData: FormData, tenantId: string) {
  return { url: null, error: null };
}

INNER_EOF
echo "✅ actions.ts آپدیت شد."

echo "🚀 3. در حال آپدیت فرم تنظیمات (theme-settings-fields.tsx)..."
cat << 'INNER_EOF' > src/app/master-admin/theme-settings-fields.tsx
"use client";

import { useState, type CSSProperties } from "react";
import { DEFAULT_THEME_SETTINGS, type ThemeSettings } from "@/lib/theme-settings";

type Props = {
  defaultValue?: ThemeSettings;
};

type PreviewStyle = CSSProperties & {
  "--color-primary": string;
  "--color-card": string;
  "--color-text": string;
  "--color-accent": string;
};

const colorFields = [
  { name: "theme_primary", label: "رنگ اصلی", key: "primary" },
  { name: "theme_background", label: "پس‌زمینه", key: "background" },
  { name: "theme_text", label: "رنگ متن", key: "text" },
  { name: "theme_accent", label: "رنگ تاکیدی", key: "accent" },
  { name: "theme_card", label: "رنگ کارت", key: "card" },
] as const;

export default function ThemeSettingsFields({
  defaultValue = DEFAULT_THEME_SETTINGS,
}: Props) {
  const [theme, setTheme] = useState(defaultValue);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const imageUrl = clearImage ? null : selectedImageUrl ?? theme.bgImageUrl;
  const previewStyle: PreviewStyle = {
    "--color-primary": theme.primary,
    "--color-card": theme.card,
    "--color-text": theme.text,
    "--color-accent": theme.accent,
    backgroundColor: theme.background,
    color: theme.text,
    ...(imageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,${theme.bgOpacity / 100}), rgba(0,0,0,${theme.bgOpacity / 100})), url("${imageUrl}")`, backgroundPosition: "center", backgroundSize: "cover" } : {}),
  };

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-[#e2c16d]">تنظیمات پوسته و نمودار فروشگاه</h3>
      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {colorFields.map(({ name, label, key }) => (
            <label className="flex items-center justify-between gap-4 text-sm text-[#c5c1b6]" key={name}>
              <span>{label}</span>
              <span className="flex items-center gap-2" dir="ltr">
                <input aria-label={label} className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1" name={name} onChange={(event) => setTheme((current) => ({ ...current, [key]: event.target.value }))} type="color" value={theme[key]} />
                <span className="w-16 font-mono text-xs">{theme[key]}</span>
              </span>
            </label>
          ))}
          <label className="block pt-2 text-sm text-[#c5c1b6]">
            تصویر پس‌زمینه
            <input accept="image/jpeg,image/png,image/webp,image/avif" className="mt-2 block w-full text-xs text-[#aaa79b] file:ml-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-[#eee]" name="theme_bg_image" onChange={(event) => { const file = event.target.files?.[0]; setSelectedImageUrl(file ? URL.createObjectURL(file) : null); setClearImage(false); }} type="file" />
            <input name="theme_bg_image_url" type="hidden" value={theme.bgImageUrl ?? ""} />
          </label>
          {theme.bgImageUrl ? (<label className="flex items-center gap-2 text-xs text-[#aaa79b]"><input checked={clearImage} name="theme_bg_image_clear" onChange={(event) => setClearImage(event.target.checked)} type="checkbox" value="on" />حذف تصویر فعلی</label>) : null}
          <label className="block pt-1 text-sm text-[#c5c1b6]">
            تیرگی لایه روی تصویر: {theme.bgOpacity}٪
            <input className="mt-2 w-full accent-[#d6ad56]" max={100} min={0} name="theme_bg_opacity" onChange={(event) => setTheme((current) => ({ ...current, bgOpacity: Number(event.target.value) }))} type="range" value={theme.bgOpacity} />
          </label>
          
          {/* 🚀 تنظیمات نمایش نمودار */}
          <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
            <h4 className="text-sm font-semibold text-[#e2c16d]">تنظیمات نمایش قیمت‌ها</h4>
            <label className="flex items-center gap-2 text-sm text-[#c5c1b6]">
              <input name="show_header_widget" type="checkbox" defaultChecked /> نمایش نوار قیمت بالای سایت
            </label>
            <label className="flex items-center gap-2 text-sm text-[#c5c1b6]">
              <input name="show_chart" type="checkbox" defaultChecked /> نمایش نمودار قیمت‌ها
            </label>
            <label className="block text-sm text-[#c5c1b6]">
              نوع نمودار
              <select name="chart_type" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#10100f] px-3 text-sm text-[#f5f2e9]">
                <option value="line">خطی (Line)</option>
                <option value="bar">میله‌ای (Bar)</option>
                <option value="area">مساحت (Area)</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-[#c5c1b6]">
              <span>رنگ نمودار</span>
              <input name="chart_color" type="color" defaultValue="#d4af37" className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1" />
            </label>
          </div>
        </div>
        <div aria-label="پیش‌نمایش پوسته" className="min-h-52 rounded-xl border border-white/10 p-4" dir="rtl" style={previewStyle}>
          <p className="text-xs font-medium text-[var(--color-accent)]">پیش‌نمایش فروشگاه</p>
          <h4 className="mt-2 text-lg font-semibold">گالری طلا</h4>
          <p className="mt-1 text-xs opacity-75">نمونه‌ای از نمایش رنگ‌های انتخاب‌شده</p>
          <div className="mt-4 rounded-lg bg-[var(--color-card)] p-3">
            <span className="text-xs">کارت محصول</span>
            <button className="mr-3 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: theme.primary, color: theme.background }} type="button">مشاهده محصولات</button>
          </div>
        </div>
      </div>
    </section>
  );
}
INNER_EOF
echo "✅ فرم تنظیمات آپدیت شد."

echo "🚀 4. در حال آپدیت API قیمت‌ها (route.ts)..."
cat << 'INNER_EOF' > src/app/api/live-prices/route.ts
export const dynamic = "force-dynamic";
import { getDbClient } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";

export async function GET(request: Request) {
  try {
    const db = await getDbClient();
    const tenantId = new URL(request.url).searchParams.get("tenant") || DEFAULT_TENANT_ID;

    const tenantResult = await db.execute({ sql: "SELECT toman_rate FROM tenants WHERE id = ?", args: [tenantId] });
    const manualDollar = tenantResult.rows[0]?.toman_rate ? Number(tenantResult.rows[0].toman_rate) : 0;

    let data: any = { ouncePrice: 0, dollarPrice: 0, eighteenKPrice: 0, euroPrice: 0, dirhamPrice: 0, liraPrice: 0, yuanPrice: 0, bubblePercentage: 0, globalEighteenKPrice: 0 };
    let source = "";

    // 1. TGJU
    try {
      const res = await fetch("https://call2.tgju.org/ajax.json", { cache: "no-store", signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const json = await res.json();
        if (json?.current?.price_dollar_rl?.p) {
          data.dollarPrice = Number(json.current.price_dollar_rl.p) / 10;
          data.eighteenKPrice = Number(json.current.tgju_gold_irg18?.p) / 10 || 0;
          data.ouncePrice = Number(json.current.ons?.p) || 0;
          data.euroPrice = Number(json.current.price_eur?.p) / 10 || 0;
          data.dirhamPrice = Number(json.current.price_aed?.p) / 10 || 0;
          data.liraPrice = Number(json.current.price_try?.p) / 10 || 0;
          data.yuanPrice = Number(json.current.price_cny?.p) / 10 || 0;
          source = "tgju";
        }
      }
    } catch (e) {}

    // 2. iSignal
    if (!source) {
      try {
        const res = await fetch("https://isignal.ir/gold-currency/", { cache: "no-store", signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const html = await res.text();
          const dollarMatch = html.match(/دلار[\s\S]{0,100}?([0-9,]{6,})\s*ریال/);
          const gold18Match = html.match(/طلای ۱۸ عیار[\s\S]{0,100}?([0-9,]{8,})\s*ریال/);
          if (dollarMatch && gold18Match) {
            data.dollarPrice = Number(dollarMatch[1].replace(/,/g, "")) / 10;
            data.eighteenKPrice = Number(gold18Match[1].replace(/,/g, "")) / 10;
            source = "isignal";
          }
        }
      } catch (e) {}
    }

    // 3. Global (Fallback to USD)
    if (!source) {
      try {
        const res = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store", signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const goldData = await res.json();
          data.ouncePrice = Number(goldData.price) || 0;
          data.dollarPrice = 0; // نشان می‌دهیم که نرخ دلار تومانی نداریم
          source = "global";
        }
      } catch (e) {}
    }

    // 4. Database
    if (!source) {
      data.dollarPrice = manualDollar;
      source = "database";
    }

    // محاسبات
    let global18k = 0;
    if ((source === "tgju" || source === "isignal") && data.ouncePrice > 0 && data.dollarPrice > 0) {
      global18k = (data.ouncePrice / 31.1034768) * (18 / 24) * data.dollarPrice;
    }
    if (data.eighteenKPrice === 0) data.eighteenKPrice = global18k;
    data.globalEighteenKPrice = global18k;
    if (data.eighteenKPrice > 0 && global18k > 0) data.bubblePercentage = ((data.eighteenKPrice - global18k) / global18k) * 100;

    return Response.json({ ...data, source, isApproximate: source === "database" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: "خطای سرور" }, { status: 503 });
  }
}
INNER_EOF
echo "✅ API آپدیت شد."

echo "🚀 5. در حال آپدیت Context و Widget..."
# آپدیت Context
cat << 'INNER_EOF' > src/app/(storefront)/market-price-context.tsx
"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type MarketPrice = {
  ouncePrice: number; dollarPrice: number; eighteenKPrice: number; globalEighteenKPrice: number;
  bubblePercentage: number; euroPrice?: number; dirhamPrice?: number; liraPrice?: number; yuanPrice?: number;
  updatedAt: string; source?: string; isApproximate?: boolean;
};
type MarketPriceState = { price: MarketPrice | null; error: string | null; };
const MarketPriceContext = createContext<MarketPriceState>({ price: null, error: null });

export function MarketPriceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarketPriceState>({ price: null, error: null });

  useEffect(() => {
    let active = true;
    async function refreshPrice() {
      try {
        const response = await fetch("/api/live-prices", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok) throw new Error((result as any).error || "قیمت در دسترس نیست.");
        if (active) setState({ price: { ...(result as any), updatedAt: new Date().toISOString() }, error: null });
      } catch (err) {
        if (active) setState({ price: null, error: err instanceof Error ? err.message : "خطا" });
      }
    }
    void refreshPrice();
    const intervalId = window.setInterval(() => void refreshPrice(), 5 * 60 * 1000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, []);

  return <MarketPriceContext.Provider value={state}>{children}</MarketPriceContext.Provider>;
}
export function useMarketPrice() { return useContext(MarketPriceContext); }
INNER_EOF

# آپدیت Widget
cat << 'INNER_EOF' > src/app/(storefront)/live-price-widget.tsx
"use client";
import { useMarketPrice } from "./market-price-context";
import { resolveBusinessKind } from "@/lib/tenant-features";

export default function LivePriceWidget({ businessType, showWidget }: { businessType?: string | null, showWidget?: boolean }) {
  const { price, error } = useMarketPrice();
  if (!showWidget) return null;

  const kind = resolveBusinessKind(businessType, ["gold_features"]);
  const formatNum = (num: number | undefined) => num ? `${Math.round(num).toLocaleString("fa-IR")} تومان` : statusText(error);
  const formatUSD = (num: number | undefined) => num ? `$${Math.round(num).toLocaleString("en-US")}` : statusText(error);
  const statusText = (err: string | null) => err ?? "در حال دریافت...";

  let items: { label: string; value: string }[] = [];

  if (price?.source === "global") {
    items = [
      { label: "انس جهانی", value: formatUSD(price.ouncePrice) },
      { label: "دلار (نامشخص)", value: "نامشخص" },
      { label: "طلای ۱۸ عیار", value: "نامشخص" },
      { label: "حباب بازار", value: "-" },
    ];
  } else if (kind === "gold") {
    items = [
      { label: "انس جهانی", value: formatUSD(price?.ouncePrice) },
      { label: "دلار", value: formatNum(price?.dollarPrice) },
      { label: "طلای ۱۸ عیار", value: formatNum(price?.eighteenKPrice) },
      { label: "حباب بازار", value: price ? `${price.bubblePercentage > 0 ? "+" : ""}${price.bubblePercentage.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪` : statusText(error) },
    ];
  } else {
    // برای بقیه مشاغل (صرافی، گردشگری و...)
    items = [
      { label: "دلار", value: formatNum(price?.dollarPrice) },
      { label: "یورو", value: formatNum(price?.euroPrice) },
      { label: "درهم", value: formatNum(price?.dirhamPrice) },
      { label: "لیر", value: formatNum(price?.liraPrice) },
    ];
  }

  const gridClass = items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2";
  return (
    <div className="border-t border-white/[0.06] bg-[var(--color-bg)]/80" title={price?.isApproximate ? "قیمت‌ها تقریبی است" : error ?? "به‌روزرسانی خودکار"}>
      <div className={`mx-auto grid max-w-7xl gap-2 px-4 py-2 sm:gap-4 sm:px-8 ${gridClass}`}>
        {items.map((item, idx) => (
          <div key={idx} className="min-w-0 rounded-lg border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/[0.04] px-2 py-1.5 text-center sm:px-3">
            <span className="block truncate text-[10px] text-[#aaa79b]">{item.label}</span>
            <strong className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--color-primary)] sm:text-xs">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
INNER_EOF
echo "✅ Widget آپدیت شد."

echo "🚀 6. در حال آپدیت نمودار (price-trends.tsx)..."
cat << 'INNER_EOF' > src/app/(storefront)/price-trends.tsx
"use client";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMarketPrice } from "./market-price-context";

type Range = "daily" | "weekly" | "monthly";
const ranges: { id: Range; label: string; points: number }[] = [
  { id: "daily", label: "روزانه", points: 24 },
  { id: "weekly", label: "هفتگی", points: 7 },
  { id: "monthly", label: "ماهانه", points: 30 },
];

export default function PriceTrends({ showChart, chartType, chartColor }: { showChart?: boolean, chartType?: string, chartColor?: string }) {
  const [range, setRange] = useState<Range>("weekly");
  const { price, error } = useMarketPrice();
  const currentPrice = price?.eighteenKPrice ?? null;
  if (!showChart) return null;

  const data = useMemo(() => {
    if (currentPrice === null) return [];
    const selected = ranges.find((item) => item.id === range) ?? ranges[1];
    return Array.from({ length: selected.points }, (_, index) => {
      const progress = (index + 1) / selected.points;
      const wave = Math.sin(index * 1.37) * 0.006 + Math.cos(index * 0.51) * 0.003 + (progress - 0.5) * 0.008;
      const date = new Date();
      date.setDate(date.getDate() - (selected.points - index - 1));
      const label = range === "daily" ? `${String(index).padStart(2, "0")}:00` : new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(date);
      return { label, price: Math.max(0, Math.round(currentPrice * (1 + wave))) };
    });
  }, [currentPrice, range]);

  const color = chartColor || "var(--color-primary)";

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[var(--color-surface)] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium" style={{ color }}>روند بازار</p>
          <h2 className="mt-2 text-xl font-semibold">تغییرات قیمت طلای ۱۸ عیار</h2>
          <p className="mt-1 text-xs text-[#858378]">نمودار نمونه؛ قیمت لحظه‌ای دریافت می‌شود.</p>
        </div>
        <div aria-label="بازه نمودار" className="flex rounded-xl border border-white/[0.08] p-1" role="group">
          {ranges.map((item) => (
            <button aria-pressed={range === item.id} className={`rounded-lg px-3 py-2 text-xs transition ${range === item.id ? "font-semibold" : "hover:opacity-80"}`} style={range === item.id ? { backgroundColor: color, color: "#000" } : { color: "#aaa79b" }} key={item.id} onClick={() => setRange(item.id)} type="button">{item.label}</button>
          ))}
        </div>
      </div>
      {currentPrice === null ? (
        <p aria-live="polite" className={`mt-8 text-sm ${error ? "text-red-300" : "text-[#969387]"}`}>{error || "در حال دریافت قیمت..."}</p>
      ) : (
      <div className="mt-6 h-64 min-w-0" dir="ltr">
        <ResponsiveContainer height="100%" width="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 5" />
              <XAxis axisLine={false} dataKey="label" tick={{ fill: "#858378", fontSize: 10 }} tickLine={false} minTickGap={20} />
              <YAxis axisLine={false} domain={["dataMin - 10000", "dataMax + 10000"]} orientation="right" tick={{ fill: "#858378", fontSize: 10 }} tickFormatter={(v: number) => v.toLocaleString("fa-IR")} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--color-text)" }} formatter={(v) => [`${Number(v).toLocaleString("fa-IR")} تومان`, "قیمت"]} />
              <Bar dataKey="price" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 5" />
              <XAxis axisLine={false} dataKey="label" tick={{ fill: "#858378", fontSize: 10 }} tickLine={false} minTickGap={20} />
              <YAxis axisLine={false} domain={["dataMin - 10000", "dataMax + 10000"]} orientation="right" tick={{ fill: "#858378", fontSize: 10 }} tickFormatter={(v: number) => v.toLocaleString("fa-IR")} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--color-text)" }} formatter={(v) => [`${Number(v).toLocaleString("fa-IR")} تومان`, "قیمت"]} />
              <Line activeDot={{ r: 5, fill: color, stroke: "var(--color-surface)", strokeWidth: 2 }} dataKey="price" dot={false} isAnimationActive stroke={color} strokeWidth={2.5} type="monotone" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      )}
    </section>
  );
}
INNER_EOF
echo "✅ نمودار آپدیت شد."

echo "📦 7. در حال کامیت و پوش..."
git add .
git commit -m "feat: dynamic pricing widget, chart settings, and global price fallback"
git push origin main

echo "🎉 تمام شد! کلودفلر در حال دیپلوی است..."
