"use client";

import { useState, type CSSProperties } from "react";
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
} from "@/lib/theme-settings";

type Props = {
  defaultValue?: ThemeSettings;
};

type PreviewStyle = CSSProperties & {
  "--color-primary": string;
};

const colorFields = [
  { name: "theme_primary", label: "Primary Color (رنگ اصلی)", key: "primary" },
  { name: "theme_background", label: "Background (پس‌زمینه)", key: "background" },
  { name: "theme_text", label: "Text Color (رنگ متن)", key: "text" },
] as const;

export default function ThemeSettingsFields({
  defaultValue = DEFAULT_THEME_SETTINGS,
}: Props) {
  const [theme, setTheme] = useState(defaultValue);
  const previewStyle: PreviewStyle = {
    "--color-primary": theme.primary,
    backgroundColor: theme.background,
    color: theme.text,
  };

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-[#e2c16d]">
        تنظیمات پوسته
      </h3>
      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {colorFields.map(({ name, label, key }) => (
            <label
              className="flex items-center justify-between gap-4 text-sm text-[#c5c1b6]"
              key={name}
            >
              <span>{label}</span>
              <span className="flex items-center gap-2" dir="ltr">
                <input
                  aria-label={label}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
                  name={name}
                  onChange={(event) =>
                    setTheme((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  type="color"
                  value={theme[key]}
                />
                <span className="w-16 font-mono text-xs">{theme[key]}</span>
              </span>
            </label>
          ))}
        </div>
        <div
          aria-label="پیش‌نمایش پوسته"
          className="rounded-xl border border-white/10 p-4"
          dir="rtl"
          style={previewStyle}
        >
          <p className="text-xs font-medium" style={{ color: theme.primary }}>
            پیش‌نمایش فروشگاه
          </p>
          <h4 className="mt-2 text-lg font-semibold">گالری طلا</h4>
          <p className="mt-1 text-xs opacity-75">
            نمونه‌ای از نمایش رنگ‌های انتخاب‌شده
          </p>
          <button
            className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ backgroundColor: theme.primary, color: theme.background }}
            type="button"
          >
            مشاهده محصولات
          </button>
        </div>
      </div>
    </section>
  );
}
