"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCustomerContext } from "@/lib/admin-context";

export async function setWishlistState(
  productId: string,
  shouldSave: boolean,
): Promise<void> {
  const customer = await getCustomerContext();
  if (!productId || productId.length > 64 || typeof shouldSave !== "boolean") {
    throw new Error("محصول انتخاب‌شده معتبر نیست.");
  }

  const product = await db.execute({
    sql: "SELECT id FROM products WHERE id = ? AND tenant_id = ? AND is_visible = 1",
    args: [productId, customer.tenantId],
  });
  if (!product.rows.length) {
    throw new Error("این محصول برای فروشگاه شما در دسترس نیست.");
  }

  if (shouldSave) {
    await db.execute({
      sql: `INSERT INTO wishlist (id, tenant_id, customer_id, product_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(tenant_id, customer_id, product_id) DO NOTHING`,
      args: [crypto.randomUUID(), customer.tenantId, customer.userId, productId],
    });
  } else {
    await db.execute({
      sql: "DELETE FROM wishlist WHERE tenant_id = ? AND customer_id = ? AND product_id = ?",
      args: [customer.tenantId, customer.userId, productId],
    });
  }

  revalidatePath("/wishlist");
}
