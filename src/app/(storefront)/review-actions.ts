"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOptionalCustomerContext } from "@/lib/admin-context";
import type { AdminActionState } from "@/app/admin/action-state";

export async function submitProductReview(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const customer = await getOptionalCustomerContext();
  if (!customer) {
    return { error: "برای ثبت دیدگاه ابتدا وارد حساب کاربری خود شوید." };
  }

  const productId = readText(formData, "product_id");
  const rating = Number(readText(formData, "rating"));
  const comment = readText(formData, "comment");
  if (!productId || productId.length > 64) {
    return { error: "محصول انتخاب‌شده معتبر نیست." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "امتیاز باید بین یک تا پنج ستاره باشد." };
  }
  if (!comment || comment.length > 2000) {
    return { error: "متن دیدگاه را وارد کنید (حداکثر ۲۰۰۰ نویسه)." };
  }

  const purchase = await db.execute({
    sql: `SELECT 1
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          WHERE o.tenant_id = ? AND o.customer_id = ?
            AND oi.tenant_id = ? AND oi.product_id = ?
          LIMIT 1`,
    args: [customer.tenantId, customer.userId, customer.tenantId, productId],
  });
  if (!purchase.rows.length) {
    return { error: "ثبت دیدگاه فقط پس از خرید این محصول امکان‌پذیر است." };
  }

  const product = await db.execute({
    sql: "SELECT id FROM products WHERE id = ? AND tenant_id = ? AND is_visible = 1",
    args: [productId, customer.tenantId],
  });
  if (!product.rows.length) {
    return { error: "این محصول دیگر در فروشگاه موجود نیست." };
  }

  await db.execute({
    sql: `INSERT INTO reviews (id, tenant_id, product_id, user_id, rating, comment)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(tenant_id, product_id, user_id)
          DO UPDATE SET rating = excluded.rating, comment = excluded.comment,
                        created_at = datetime('now')`,
    args: [
      crypto.randomUUID(),
      customer.tenantId,
      productId,
      customer.userId,
      rating,
      comment,
    ],
  });

  revalidatePath("/wishlist");
  revalidatePath("/[tenant_slug]/products/[productId]", "page");
  return { success: "دیدگاه شما ثبت شد." };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
