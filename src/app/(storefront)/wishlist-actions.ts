"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCustomerContext } from "@/lib/admin-context";
import { parseTenantModules } from "@/lib/tenant-modules";

export async function setWishlistState(
  productId: string,
  shouldSave: boolean,
): Promise<void> {
  const customer = await getCustomerContext();
  if (!productId || productId.length > 64 || typeof shouldSave !== "boolean") {
    throw new Error("محصول انتخاب‌شده معتبر نیست.");
  }
  const tenant = await db.execute({
    sql: "SELECT enabled_modules, template_id FROM tenants WHERE id = ?",
    args: [customer.tenantId],
  });
  const tenantRow = tenant.rows[0];
  if (
    !tenantRow ||
    !parseTenantModules(tenantRow.enabled_modules).includes("ecommerce") ||
    tenantRow.template_id === "corporate"
  ) {
    throw new Error("علاقه‌مندی‌ها برای این فروشگاه فعال نیست.");
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
