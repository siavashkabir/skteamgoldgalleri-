"use server";

import { revalidatePath } from "next/cache";
import { requireTenantModule } from "@/lib/admin-context";
import { db } from "@/lib/db";

const orderStatuses = ["pending", "processing", "completed", "cancelled"] as const;

export async function updateOrderStatus(formData: FormData): Promise<void> {
  const { tenantId } = await requireTenantModule("ecommerce");
  const orderId = formData.get("order_id");
  const status = formData.get("status");

  if (
    typeof orderId !== "string" ||
    !orderId.trim() ||
    typeof status !== "string" ||
    !orderStatuses.some((validStatus) => validStatus === status)
  ) {
    throw new Error("اطلاعات وضعیت سفارش معتبر نیست.");
  }

  const normalizedOrderId = orderId.trim();
  const existingOrder = await db.execute({
    sql: "SELECT customer_id FROM orders WHERE id = ? AND tenant_id = ? LIMIT 1",
    args: [normalizedOrderId, tenantId],
  });
  const customerId = existingOrder.rows[0]?.customer_id;
  if (typeof customerId !== "string") {
    throw new Error("سفارش پیدا نشد.");
  }

  const result = await db.execute({
    sql: "UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?",
    args: [status, normalizedOrderId, tenantId],
  });
  if (result.rowsAffected !== 1) {
    throw new Error("به‌روزرسانی وضعیت سفارش انجام نشد.");
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/customers/${encodeURIComponent(customerId)}`);
}
