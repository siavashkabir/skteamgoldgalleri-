import "server-only";

import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const emailClaim = data?.claims?.email;

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
  const context = await getAuthenticatedProfile();
  if (context.role === "tenant_admin") {
    return {
      userId: context.userId,
      email: context.email,
      tenantId: context.tenantId,
      tenantName: context.tenantName,
      role: "tenant_admin",
    };
  }
  if (context.role === "super_admin") {
    return {
      userId: context.userId,
      email: context.email,
      tenantId: context.tenantId,
      tenantName: context.tenantName,
      role: "super_admin",
    };
  }
  notFound();
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
