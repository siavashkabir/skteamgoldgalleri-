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

export async function getTenantAdminContext(): Promise<TenantAdminContext> {
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
    sql: `SELECT p.tenant_id, p.role, t.name AS tenant_name
          FROM profiles p
          JOIN tenants t ON t.id = p.tenant_id
          WHERE p.id = ?`,
    args: [userId],
  });
  const profile = result.rows[0];
  const role = profile?.role;

  if (!profile || (role !== "tenant_admin" && role !== "super_admin")) {
    notFound();
  }

  return {
    userId,
    email: typeof emailClaim === "string" ? emailClaim : "مدیر فروشگاه",
    tenantId: String(profile.tenant_id),
    tenantName: String(profile.tenant_name),
    role,
  };
}

export async function getSuperAdminContext(): Promise<TenantAdminContext> {
  const context = await getTenantAdminContext();
  if (context.role !== "super_admin") {
    notFound();
  }
  return context;
}
