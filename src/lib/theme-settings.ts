export type ThemeSettings = {
  primary: string;
  background: string;
  text: string;
  accent: string;
  card: string;
  bgImageUrl: string | null;
  bgOpacity: number;
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  primary: "#d4af37",
  background: "#0a0a0a",
  text: "#ffffff",
  accent: "#e2c16d",
  card: "#151514",
  bgImageUrl: null,
  bgOpacity: 45,
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
  const primary = parseColor(settings.primary, DEFAULT_THEME_SETTINGS.primary);
  const background = parseColor(settings.background, DEFAULT_THEME_SETTINGS.background);
  const text = parseColor(settings.text, DEFAULT_THEME_SETTINGS.text);
  const accent = parseColor(settings.accent, DEFAULT_THEME_SETTINGS.accent);
  const card = parseColor(settings.card, DEFAULT_THEME_SETTINGS.card);
  const bgImageUrl = settings.bgImageUrl;
  const bgOpacity = settings.bgOpacity ?? DEFAULT_THEME_SETTINGS.bgOpacity;
  if (
    (bgImageUrl !== undefined &&
      bgImageUrl !== null &&
      (typeof bgImageUrl !== "string" || !isHttpUrl(bgImageUrl))) ||
    typeof bgOpacity !== "number" ||
    !Number.isInteger(bgOpacity) ||
    bgOpacity < 0 ||
    bgOpacity > 100
  ) {
    throw new Error("تنظیمات پس‌زمینه ذخیره‌شده فروشگاه معتبر نیست.");
  }

  return {
    primary,
    background,
    text,
    accent,
    card,
    bgImageUrl: typeof bgImageUrl === "string" ? bgImageUrl : null,
    bgOpacity,
  };
}

function parseColor(value: unknown, fallback: string): string {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "string" || !isThemeColor(value)) {
    throw new Error("تنظیمات رنگ ذخیره‌شده فروشگاه معتبر نیست.");
  }
  return value;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
