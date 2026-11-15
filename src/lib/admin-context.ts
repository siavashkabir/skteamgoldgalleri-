import "server-only";

import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readImpersonatedTenantId } from "@/lib/admin-impersonation";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";

export const SUPER_ADMIN_EMAIL = "sk.team.it@gmail.com";

export type TenantAdminContext = {
  userId: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: "tenant_admin" | "super_admin";
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

export async function getTenantAdminContext(): Promise<TenantAdminContext> {
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
      sql: "SELECT id, name FROM tenants WHERE id = ?",
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
    };
  }

  const result = await db.execute({
    sql: `SELECT id, name FROM tenants
          WHERE lower(trim(owner_email)) = ? LIMIT 1`,
    args: [email],
  });
  const tenant = result.rows[0];
  if (!tenant) {
    redirect("/login?error=access_denied");
  }
  return {
    userId,
    email,
    tenantId: String(tenant.id),
    tenantName: String(tenant.name),
    role: "tenant_admin",
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
