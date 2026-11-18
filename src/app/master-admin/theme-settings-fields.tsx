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

          <div aria-label="پیش‌نمایش پوسته" className="min-h-40 rounded-xl border border-white/10 p-4" dir="rtl" style={{ ...previewStyle, "--color-primary": theme.primary, "--color-card": theme.card, "--color-text": theme.text, backgroundColor: theme.background, color: theme.text } as React.CSSProperties}>
            <p className="text-xs font-medium text-[var(--color-accent)]">پیش‌نمایش فروشگاه</p>
            <h4 className="mt-2 text-lg font-semibold">گالری طلا</h4>
          </div>
        </div>
      </div>
    </section>
  );
}
