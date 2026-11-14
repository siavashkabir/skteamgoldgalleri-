"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSuperAdminContext } from "@/lib/admin-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TenantActionState = {
  error?: string;
  success?: string;
};

export async function createTenant(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await getSuperAdminContext();

  const nameEntry = formData.get("name");
  const domainEntry = formData.get("domain");
  const name = typeof nameEntry === "string" ? nameEntry.trim() : "";
  const domain = typeof domainEntry === "string" ? domainEntry.trim() : "";

  if (!name) {
    return { error: "نام فروشگاه را وارد کنید." };
  }
  if (name.length > 120) {
    return { error: "نام فروشگاه نباید بیشتر از ۱۲۰ نویسه باشد." };
  }
  if (domain.length > 253) {
    return { error: "نشانی دامنه نباید بیشتر از ۲۵۳ نویسه باشد." };
  }

  await db.execute({
    sql: "INSERT INTO tenants (id, name, domain) VALUES (?, ?, ?)",
    args: [crypto.randomUUID(), name, domain || null],
  });

  revalidatePath("/master-admin");
  return { success: "فروشگاه جدید با موفقیت اضافه شد." };
}

export async function updateTenant(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await getSuperAdminContext();

  const idEntry = formData.get("id");
  const nameEntry = formData.get("name");
  const domainEntry = formData.get("domain");
  const id = typeof idEntry === "string" ? idEntry.trim() : "";
  const name = typeof nameEntry === "string" ? nameEntry.trim() : "";
  const domain = typeof domainEntry === "string" ? domainEntry.trim() : "";

  if (!id) {
    return { error: "شناسه فروشگاه معتبر نیست." };
  }
  if (!name || name.length > 120) {
    return { error: "نام فروشگاه را وارد کنید (حداکثر ۱۲۰ نویسه)." };
  }
  if (
    domain.length > 253 ||
    (domain !== "" &&
      (!/^[a-zA-Z0-9.-]+$/.test(domain) ||
        domain.startsWith(".") ||
        domain.endsWith(".") ||
        domain.includes("..")))
  ) {
    return { error: "نام دامنه معتبر نیست؛ فقط نام میزبان را وارد کنید." };
  }

  const result = await db.execute({
    sql: "UPDATE tenants SET name = ?, domain = ? WHERE id = ?",
    args: [name, domain || null, id],
  });
  if (result.rowsAffected === 0) {
    return { error: "فروشگاه پیدا نشد." };
  }

  revalidatePath("/master-admin");
  return { success: "اطلاعات فروشگاه ذخیره شد." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  redirect("/login");
}
