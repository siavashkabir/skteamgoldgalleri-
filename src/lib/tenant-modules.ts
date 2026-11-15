export const TENANT_MODULES = [
  "ecommerce",
  "booking",
  "gallery",
  "tourism",
  "corporate",
] as const;

export type TenantModule = (typeof TENANT_MODULES)[number];

export function parseTenantModules(value: unknown): TenantModule[] {
  let parsed: unknown;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new Error("تنظیم ماژول‌های فروشگاه در پایگاه داده معتبر نیست.");
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (module): module is TenantModule =>
        typeof module === "string" &&
        TENANT_MODULES.includes(module as TenantModule),
    )
  ) {
    throw new Error("تنظیم ماژول‌های فروشگاه در پایگاه داده معتبر نیست.");
  }
  return parsed;
}

export function hasTenantModule(
  modules: readonly TenantModule[],
  module: TenantModule,
): boolean {
  return modules.includes(module);
}
