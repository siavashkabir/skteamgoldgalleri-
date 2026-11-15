export type BusinessKind = "gold" | "auto_parts" | "general";

/** Auto-parts attributes are stored inside the product's specifications JSON. */
export const AUTO_PART_SPEC_KEYS = {
  brand: "برند",
  car_model: "مدل خودرو",
  car_year: "سال ساخت",
} as const;

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  gold: "طلا و جواهر",
  auto_parts: "قطعات خودرو",
  clinic: "سلامت و درمان",
  tourism: "سفر و گردشگری",
  general: "",
};

/** Known codes become Persian labels; any other (legacy free) text is shown as is. */
export function businessTypeLabel(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  if (!text) return "";
  return Object.prototype.hasOwnProperty.call(BUSINESS_TYPE_LABELS, text)
    ? BUSINESS_TYPE_LABELS[text]
    : text;
}

export function parseEnabledModules(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((m): m is string => typeof m === "string");
  }
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((m): m is string => typeof m === "string")
      : [];
  } catch {
    return [];
  }
}

export function hasModule(
  modules: readonly string[] | null | undefined,
  name: string,
): boolean {
  return Array.isArray(modules) && modules.includes(name);
}

export function resolveBusinessKind(
  businessType: string | null | undefined,
  enabledModules: readonly string[] | null | undefined,
): BusinessKind {
  const text = (businessType ?? "").trim().toLowerCase();
  if (text.includes("auto") || text.includes("خودرو") || text.includes("یدک")) {
    return "auto_parts";
  }
  if (
    text.includes("gold") ||
    text.includes("طلا") ||
    text.includes("جواهر") ||
    text.includes("زیور")
  ) {
    return "gold";
  }
  return hasModule(enabledModules, "gold_features") ? "gold" : "general";
}

type TenantLike = {
  business_type?: string | null;
  enabled_modules?: readonly string[] | null;
};

/** Gold price ticker, chart and calculator. */
export function showGoldFeatures(tenant: TenantLike | null | undefined): boolean {
  return hasModule(tenant?.enabled_modules, "gold_features");
}

/** Gold-only decoration such as the large diamond icon. */
export function isGoldShop(tenant: TenantLike | null | undefined): boolean {
  return (
    resolveBusinessKind(tenant?.business_type, tenant?.enabled_modules) === "gold"
  );
}
