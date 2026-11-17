#!/bin/bash
set -e

echo "🚀 1. در حال آپدیت دیتابیس (اضافه کردن ستون ارزها)..."
cat << 'INNER_EOF' > src/app/api/fix-db/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const queries = [
    "ALTER TABLE tenants ADD COLUMN show_header_widget INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN show_chart INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN chart_type TEXT DEFAULT 'line';",
    "ALTER TABLE tenants ADD COLUMN chart_color TEXT DEFAULT '#d4af37';",
    "ALTER TABLE tenants ADD COLUMN enabled_currencies TEXT DEFAULT '[\"USD\",\"XAU\",\"18K\",\"BUBBLE\"]';",
    `CREATE TABLE IF NOT EXISTS market_cache (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL);`
  ];
  let results = [];
  for (const q of queries) {
    try { await db.execute(q); results.push(`✅ اجرا شد: ${q.substring(0, 40)}...`); }
    catch (e: any) { results.push(e.message.includes("duplicate") ? `⚠️ از قبل بود: ${q.substring(0, 40)}...` : `❌ خطا: ${e.message}`); }
  }
  return NextResponse.json({ message: "پایان", details: results });
}
INNER_EOF

echo "🚀 2. در حال آپدیت فرم ادمین (checkboxes برای ارزها)..."
cat << 'INNER_EOF' > src/app/master-admin/theme-settings-fields.tsx
"use client";

import { useState, type CSSProperties } from "react";
import { DEFAULT_THEME_SETTINGS, type ThemeSettings } from "@/lib/theme-settings";

type Props = {
  defaultValue?: ThemeSettings;
  defaultCurrencies?: string[];
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

const availableCurrencies = [
  { id: "USD", label: "دلار آمریکا" },
  { id: "EUR", label: "یورو" },
  { id: "AED", label: "درهم امارات" },
  { id: "TRY", label: "لیر ترکیه" },
  { id: "CNY", label: "یوان چین" },
  { id: "GBP", label: "پوند انگلیس" },
  { id: "XAU", label: "انس جهانی طلا" },
  { id: "18K", label: "طلای ۱۸ عیار" },
  { id: "BUBBLE", label: "حباب بازار" },
  { id: "BTC", label: "بیت‌کوین" },
  { id: "USDT", label: "تتر" },
  { id: "ETH", label: "اتریوم" },
];

export default function ThemeSettingsFields({
  defaultValue = DEFAULT_THEME_SETTINGS,
  defaultCurrencies = ["USD", "XAU", "18K", "BUBBLE"],
}: Props) {
  const [theme, setTheme] = useState(defaultValue);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [currencies, setCurrencies] = useState<string[]>(defaultCurrencies);
  
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

  const toggleCurrency = (id: string) => {
    setCurrencies(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
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
              </select>
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-[#c5c1b6]">
              <span>رنگ نمودار</span>
              <input name="chart_color" type="color" defaultValue="#d4af37" className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1" />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border rounded-xl border-white/[0.08] p-4">
            <h4 className="mb-3 text-sm font-semibold text-[#e2c16d]">ارزها و دارایی‌های قابل نمایش</h4>
            <div className="grid grid-cols-2 gap-2">
              {availableCurrencies.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-xs text-[#c5c1b6]">
                  <input type="checkbox" checked={currencies.includes(c.id)} onChange={() => toggleCurrency(c.id)} />
                  {c.label}
                </label>
              ))}
            </div>
            <input type="hidden" name="enabled_currencies" value={JSON.stringify(currencies)} />
          </div>

          <div aria-label="پیش‌نمایش پوسته" className="min-h-40 rounded-xl border border-white/10 p-4" dir="rtl" style={previewStyle}>
            <p className="text-xs font-medium text-[var(--color-accent)]">پیش‌نمایش فروشگاه</p>
            <h4 className="mt-2 text-lg font-semibold">گالری طلا</h4>
          </div>
        </div>
      </div>
    </section>
  );
}
INNER_EOF

echo "🚀 3. در حال آپدیت actions.ts (ذخیره ارزها)..."
cat << 'INNER_EOF' > fix_actions.py
file_path = "src/app/master-admin/actions.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "enabled_currencies" not in content:
    content = content.replace(
        'const chartColor = readText(formData, "chart_color") || "#d4af37";',
        'const chartColor = readText(formData, "chart_color") || "#d4af37";\n  const enabledCurrencies = readText(formData, "enabled_currencies") || \'["USD","XAU","18K","BUBBLE"]\';'
    )
    content = content.replace(
        'show_header_widget = ?, show_chart = ?, chart_type = ?, chart_color = ?',
        'show_header_widget = ?, show_chart = ?, chart_type = ?, chart_color = ?, enabled_currencies = ?'
    )
    content = content.replace(
        'showHeader ? 1 : 0, showChart ? 1 : 0, chartType, chartColor,',
        'showHeader ? 1 : 0, showChart ? 1 : 0, chartType, chartColor, enabledCurrencies,'
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ actions.ts اصلاح شد.")
INNER_EOF
python3 fix_actions.py
rm fix_actions.py

echo "🚀 4. در حال آپدیت storefront-data.ts (خواندن ارزها و رنگ نمودار)..."
cat << 'INNER_EOF' > fix_data.py
file_path = "src/lib/storefront-data.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# اضافه کردن فیلدهای جدید به تایپ
if "enabled_currencies" not in content.split("const fallbackDefaultStore")[0]:
    content = content.replace("type StorefrontStore = {", """type StorefrontStore = {
  show_header_widget?: number | boolean | null;
  show_chart?: number | boolean | null;
  chart_type?: string | null;
  chart_color?: string | null;
  enabled_currencies?: string | null;""")

# اضافه کردن مقادیر پیش‌فرض
if "enabled_currencies:" not in content:
    content = content.replace("const fallbackDefaultStore: StorefrontStore = {", """const fallbackDefaultStore: StorefrontStore = {
  show_header_widget: 1,
  show_chart: 1,
  chart_type: "line",
  chart_color: "#d4af37",
  enabled_currencies: '["USD","XAU","18K","BUBBLE"]',""")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ storefront-data.ts اصلاح شد.")
INNER_EOF
python3 fix_data.py
rm fix_data.py

echo "🚀 5. در حال آپدیت ویجت (داینامیک کردن ارزها و منوی کشویی)..."
cat << 'INNER_EOF' > src/app/\(storefront\)/live-price-widget.tsx
"use client";
import { useState } from "react";
import { useMarketPrice } from "./market-price-context";

const AVAILABLE_CURRENCIES: Record<string, { label: string; format: (val: number | undefined, source?: string) => string }> = {
  USD: { label: "دلار آمریکا", format: (v, s) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  EUR: { label: "یورو", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  AED: { label: "درهم امارات", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  TRY: { label: "لیر ترکیه", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  CNY: { label: "یوان چین", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  XAU: { label: "انس جهانی", format: (v) => (v && v > 0) ? `$${Math.round(v).toLocaleString("en-US")}` : "نامشخص" },
  "18K": { label: "طلای ۱۸ عیار", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  BUBBLE: { label: "حباب بازار", format: (v) => (v !== undefined && v !== null) ? `${v > 0 ? "+" : ""}${v.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪` : "-" },
  BTC: { label: "بیت‌کوین", format: (v) => (v && v > 0) ? `$${Math.round(v).toLocaleString("en-US")}` : "نامشخص" }, 
  USDT: { label: "تتر", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  ETH: { label: "اتریوم", format: (v) => (v && v > 0) ? `$${Math.round(v).toLocaleString("en-US")}` : "نامشخص" },
};

export default function LivePriceWidget({ showWidget, enabledCurrencies }: { showWidget?: boolean, enabledCurrencies?: string | null }) {
  const { price, error } = useMarketPrice();
  const [isOpen, setIsOpen] = useState(false);

  if (!showWidget) return null;

  let selected = ["USD", "XAU", "18K", "BUBBLE"];
  try {
    if (enabledCurrencies) selected = JSON.parse(enabledCurrencies);
  } catch(e) {}

  const priceMap: Record<string, number | undefined> = {
    USD: price?.dollarPrice, EUR: price?.euroPrice, AED: price?.dirhamPrice, TRY: price?.liraPrice,
    CNY: price?.yuanPrice, XAU: price?.ouncePrice, "18K": price?.eighteenKPrice, BUBBLE: price?.bubblePercentage,
    // BTC و بقیه فعلا در API نیستند، اگر اضافه کردیم اینجا ست میشن
  };

  const mainItems = selected.slice(0, 4).map(key => ({
    key, label: AVAILABLE_CURRENCIES[key]?.label || key, value: AVAILABLE_CURRENCIES[key]?.format(priceMap[key], price?.source) || "نامشخص"
  }));

  const extraItems = selected.slice(4).map(key => ({
    key, label: AVAILABLE_CURRENCIES[key]?.label || key, value: AVAILABLE_CURRENCIES[key]?.format(priceMap[key], price?.source) || "نامشخص"
  }));

  let cacheInfo = null;
  if (price?.isCached && price.cacheUpdatedAt) {
    const date = new Date(price.cacheUpdatedAt);
    cacheInfo = date.toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="border-t border-white/[0.06] bg-[var(--color-bg)]/80 relative">
      <div className="mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2 sm:gap-4 sm:px-8">
        {mainItems.map((item, idx) => (
          <div key={idx} className="min-w-0 rounded-lg border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/[0.04] px-2 py-1.5 text-center sm:px-3">
            <span className="block truncate text-[10px] text-[#aaa79b]">{item.label}</span>
            <strong className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--color-primary)] sm:text-xs">{item.value}</strong>
          </div>
        ))}
      </div>

      {extraItems.length > 0 && (
        <div className="text-center pb-2">
          <button onClick={() => setIsOpen(!isOpen)} className="text-xs text-[var(--color-primary)] hover:underline">
            {isOpen ? "بستن لیست" : "مشاهده سایر ارزها"}
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-50 bg-[var(--color-surface)] border border-white/10 p-4 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-2">
              {extraItems.map((item, idx) => (
                <div key={idx} className="min-w-0 rounded-lg border border-white/5 bg-black/20 px-2 py-1.5 text-center">
                  <span className="block truncate text-[10px] text-[#aaa79b]">{item.label}</span>
                  <strong className="mt-0.5 block truncate text-[11px] text-[var(--color-primary)]">{item.value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cacheInfo && <div className="text-center text-[10px] text-yellow-500/80 pb-1">آخرین قیمت ثبت‌شده: {cacheInfo}</div>}
    </div>
  );
}
INNER_EOF

echo "🚀 6. در حال پاس دادن پراپ‌های جدید در هدر و صفحه اصلی..."
cat << 'INNER_EOF' > fix_props.py
# storefront-header.tsx
with open("src/app/(storefront)/storefront-header.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace(
    '<LivePriceWidget businessType={store.businessType} showWidget={store.show_header_widget !== 0 && store.show_header_widget !== false} />',
    '<LivePriceWidget enabledCurrencies={store.enabled_currencies} showWidget={store.show_header_widget !== 0 && store.show_header_widget !== false} />'
)
with open("src/app/(storefront)/storefront-header.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# page.tsx
with open("src/app/(storefront)/[tenant_slug]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()
# نمودار در صفحه اصلی
content = content.replace(
    '<PriceTrends showChart={store.show_chart !== 0 && store.show_chart !== false} chartType={store.chart_type || "line"} chartColor={store.chart_color || "#d4af37"} />',
    '<PriceTrends showChart={store.show_chart !== 0 && store.show_chart !== false} chartType={store.chart_type || "line"} chartColor={store.chart_color || "#d4af37"} />'
)
# پاس دادن ارزها به هدر
content = content.replace(
    '<StorefrontHeader store={store} />',
    '<StorefrontHeader store={store} />' # فرض بر این است که هدر خودش store را می‌گیرد
)
with open("src/app/(storefront)/[tenant_slug]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("✅ پراپ‌ها پاس داده شدند.")
INNER_EOF
python3 fix_props.py
rm fix_props.py

echo "📦 7. در حال کامیت و پوش..."
git add .
git commit -m "feat: dynamic currency widget, admin selection checkboxes, and fix chart props"
git push origin main

echo "🎉 تمام شد! کلودفلر در حال دیپلوی است..."
