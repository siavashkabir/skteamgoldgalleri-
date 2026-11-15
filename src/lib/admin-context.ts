import "server-only";

import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readImpersonatedTenantId } from "@/lib/admin-impersonation";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";
import {
  hasTenantModule,
  parseTenantModules,
  type TenantModule,
} from "@/lib/tenant-modules";

export const SUPER_ADMIN_EMAIL = "sk.team.it@gmail.com";

export type TenantAdminContext = {
  userId: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: "tenant_admin" | "super_admin";
  enabledModules: TenantModule[];
  businessType: string;
  kycData: Record<string, string>;
  licenseUrl: string | null;
  legalAgreedAt: string | null;
};

export type AuthenticatedProfile = {
  userId: string;
  email: string;
  tenantId: string;
  tenantName: string;
  fullName: string;
  role: "tenant_admin" | "super_admin" | "customer";
};

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    throw error;
  }

  const userId = data?.claims?.sub;
  if (typeof userId !== "string") {
    redirect("/login");
  }
  return getProfileForUser(userId, data?.claims?.email);
}

export async function getOptionalCustomerContext(): Promise<AuthenticatedProfile | null> {
  const profile = await getOptionalAuthenticatedProfile();
  if (!profile) {
    return null;
  }
  if (profile.role !== "customer") {
    notFound();
  }
  return profile;
}

export async function getOptionalAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (
    error &&
    error.status !== 401 &&
    error.name !== "AuthSessionMissingError"
  ) {
    throw error;
  }
  if (error) {
    return null;
  }

  const userId = data?.claims?.sub;
  if (typeof userId !== "string") {
    return null;
  }

  return getProfileForUser(userId, data?.claims?.email);
}

async function getProfileForUser(
  userId: string,
  emailClaim: unknown,
): Promise<AuthenticatedProfile> {
  const result = await db.execute({
    sql: `SELECT p.tenant_id, p.role, p.full_name, t.name AS tenant_name
          FROM profiles p
          JOIN tenants t ON t.id = p.tenant_id
          WHERE p.id = ?`,
    args: [userId],
  });
  const profile = result.rows[0];
  const role = profile?.role;

  if (
    !profile ||
    (role !== "tenant_admin" && role !== "super_admin" && role !== "customer")
  ) {
    notFound();
  }

  return {
    userId,
    email: typeof emailClaim === "string" ? emailClaim : "مدیر فروشگاه",
    tenantId: String(profile.tenant_id),
    tenantName: String(profile.tenant_name),
    fullName:
      typeof profile.full_name === "string" && profile.full_name
        ? profile.full_name
        : "",
    role,
  };
}

export async function getTenantAdminContext(
  options: { allowIncompleteProfile?: boolean } = {},
): Promise<TenantAdminContext> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    if (error.status === 401 || error.name === "AuthSessionMissingError") {
      redirect("/login?error=access_denied");
    }
    throw error;
  }
  const userId = data?.claims?.sub;
  const email =
    typeof data?.claims?.email === "string"
      ? data.claims.email.trim().toLowerCase()
      : "";
  if (typeof userId !== "string" || !email) {
    redirect("/login?error=access_denied");
  }

  if (email === SUPER_ADMIN_EMAIL) {
    const impersonatedTenantId = await readImpersonatedTenantId();
    const tenantId = impersonatedTenantId ?? DEFAULT_TENANT_ID;
    const tenant = await db.execute({
      sql: `SELECT id, name, enabled_modules, business_type, kyc_data,
                   license_url, legal_agreed_at
            FROM tenants WHERE id = ?`,
      args: [tenantId],
    });
    const row = tenant.rows[0];
    if (!row) {
      if (impersonatedTenantId) {
        redirect("/master-admin");
      }
      throw new Error("فروشگاه پیش‌فرض پنل مدیریت پیدا نشد.");
    }
    return {
      userId,
      email,
      tenantId: String(row.id),
      tenantName: String(row.name),
      role: "super_admin",
      enabledModules: parseTenantModules(row.enabled_modules),
      businessType: row.business_type === null ? "" : String(row.business_type),
      kycData: parseKycData(row.kyc_data),
      licenseUrl: row.license_url === null ? null : String(row.license_url),
      legalAgreedAt:
        row.legal_agreed_at === null ? null : String(row.legal_agreed_at),
    };
  }

  const result = await db.execute({
    sql: `SELECT id, name, enabled_modules, business_type, kyc_data,
                 license_url, legal_agreed_at
          FROM tenants
          WHERE lower(trim(owner_email)) = ? LIMIT 1`,
    args: [email],
  });
  const tenant = result.rows[0];
  if (!tenant) {
    const profileResult = await db.execute({
      sql: "SELECT role FROM profiles WHERE id = ? LIMIT 1",
      args: [userId],
    });
    if (profileResult.rows[0]?.role === "customer") {
      redirect("/profile");
    }
    redirect("/login?error=access_denied");
  }
  const kycData = parseKycData(tenant.kyc_data);
  const legalAgreedAt =
    tenant.legal_agreed_at === null ? null : String(tenant.legal_agreed_at);
  if (
    !options.allowIncompleteProfile &&
    (!kycData.full_name ||
      !kycData.national_id ||
      !kycData.address ||
      !kycData.phone ||
      !legalAgreedAt)
  ) {
    redirect("/admin?onboarding=required");
  }
  return {
    userId,
    email,
    tenantId: String(tenant.id),
    tenantName: String(tenant.name),
    role: "tenant_admin",
    enabledModules: parseTenantModules(tenant.enabled_modules),
    businessType:
      tenant.business_type === null ? "" : String(tenant.business_type),
    kycData,
    licenseUrl:
      tenant.license_url === null ? null : String(tenant.license_url),
    legalAgreedAt,
  };
}

export async function getCustomerContext(): Promise<AuthenticatedProfile> {
  const context = await getAuthenticatedProfile();
  if (context.role !== "customer") {
    notFound();
  }
  return context;
}

export async function getSuperAdminContext(): Promise<TenantAdminContext> {
  const context = await getTenantAdminContext();
  if (context.role !== "super_admin") {
    notFound();
  }
  return context;
}

export async function requireTenantModule(
  module: TenantModule,
): Promise<TenantAdminContext> {
  const context = await getTenantAdminContext();
  if (
    context.role !== "super_admin" &&
    !hasTenantModule(context.enabledModules, module)
  ) {
    notFound();
  }
  return context;
}

function parseKycData(value: unknown): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new Error("اطلاعات احراز هویت فروشگاه در پایگاه داده معتبر نیست.");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !Object.values(parsed).every((item) => typeof item === "string")
  ) {
    throw new Error("اطلاعات احراز هویت فروشگاه در پایگاه داده معتبر نیست.");
  }
  return parsed as Record<string, string>;
}
