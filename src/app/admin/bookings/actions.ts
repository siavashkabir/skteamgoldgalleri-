"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantAdminContext } from "@/lib/admin-context";

export async function updateBookingStatus(formData: FormData): Promise<void> {
  const context = await getTenantAdminContext();
  if (
    context.role !== "super_admin" &&
    !context.enabledModules.some(
      (module) => module === "booking" || module === "tourism",
    )
  ) {
    throw new Error("مدیریت رزروها برای این فروشگاه فعال نیست.");
  }
  const id = readText(formData, "id");
  const status = readText(formData, "status");
  if (!id || !["pending", "confirmed", "completed", "cancelled"].includes(status)) {
    throw new Error("درخواست رزرو یا وضعیت معتبر نیست.");
  }
  const result = await db.execute({
    sql: "UPDATE bookings SET status = ? WHERE id = ? AND tenant_id = ?",
    args: [status, id, context.tenantId],
  });
  if (!result.rowsAffected) {
    throw new Error("درخواست رزرو پیدا نشد.");
  }
  revalidatePath("/admin/bookings");
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
