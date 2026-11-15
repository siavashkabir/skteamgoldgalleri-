export type ThemeSettings = {
  primary: string;
  background: string;
  text: string;
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  primary: "#d4af37",
  background: "#0a0a0a",
  text: "#ffffff",
};

const hexColorPattern = /^#[\da-f]{6}$/i;

export function isThemeColor(value: string): boolean {
  return hexColorPattern.test(value);
}

export function parseThemeSettings(value: unknown): ThemeSettings {
  let parsed: unknown;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new Error("تنظیمات رنگ ذخیره‌شده فروشگاه معتبر نیست.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("تنظیمات رنگ ذخیره‌شده فروشگاه معتبر نیست.");
  }

  const settings = parsed as Record<string, unknown>;
  if (
    typeof settings.primary !== "string" ||
    !isThemeColor(settings.primary) ||
    typeof settings.background !== "string" ||
    !isThemeColor(settings.background) ||
    typeof settings.text !== "string" ||
    !isThemeColor(settings.text)
  ) {
    throw new Error("تنظیمات رنگ ذخیره‌شده فروشگاه معتبر نیست.");
  }

  return {
    primary: settings.primary,
    background: settings.background,
    text: settings.text,
  };
}
