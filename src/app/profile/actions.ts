"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCustomerContext } from "@/lib/admin-context";
import { supabaseAdmin } from "@/lib/supabase";
import type { AdminActionState } from "../admin/action-state";

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const maximumImageSize = 5 * 1024 * 1024;

export async function saveProfile(
  formData: FormData,
): Promise<void> {
  const { userId, tenantId } = await getCustomerContext();
  const fullName = readText(formData, "full_name");
  if (!fullName || fullName.length > 120) {
    throw new Error("نام باید بین ۱ تا ۱۲۰ نویسه باشد.");
  }

  const result = await db.execute({
    sql: "UPDATE profiles SET full_name = ? WHERE id = ? AND tenant_id = ? AND role = 'customer'",
    args: [fullName, userId, tenantId],
  });
  if (result.rowsAffected !== 1) {
    throw new Error("اطلاعات حساب کاربری ذخیره نشد.");
  }
  revalidatePath("/profile");
}

export async function addItemToCart(formData: FormData): Promise<void> {
  const { userId, tenantId } = await getCustomerContext();
  const productId = readText(formData, "product_id");
  const quantity = Number(readText(formData, "quantity") || "1");
  if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("محصول یا تعداد انتخاب‌شده معتبر نیست.");
  }

  const product = await db.execute({
    sql: "SELECT id FROM products WHERE id = ? AND tenant_id = ? AND is_visible = 1",
    args: [productId, tenantId],
  });
  if (product.rows.length === 0) {
    throw new Error("این محصول برای خرید در دسترس نیست.");
  }

  await db.execute({
    sql: `INSERT INTO cart_items (id, tenant_id, customer_id, product_id, quantity)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(tenant_id, customer_id, product_id)
          DO UPDATE SET quantity = MIN(cart_items.quantity + excluded.quantity, 99)`,
    args: [crypto.randomUUID(), tenantId, userId, productId, quantity],
  });
  revalidatePath("/profile");
}

export async function removeCartItem(formData: FormData): Promise<void> {
  const { userId, tenantId } = await getCustomerContext();
  const itemId = readText(formData, "item_id");
  if (!itemId) {
    throw new Error("شناسه محصول معتبر نیست.");
  }

  await db.execute({
    sql: "DELETE FROM cart_items WHERE id = ? AND tenant_id = ? AND customer_id = ?",
    args: [itemId, tenantId, userId],
  });
  revalidatePath("/profile");
}

export async function submitCustomOrder(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { userId, tenantId } = await getCustomerContext();
  const description = readText(formData, "description");
  const contactInfo = readText(formData, "contact_info");
  const image = formData.get("image");

  if (!description || description.length > 5000) {
    return { error: "توضیحات را وارد کنید (حداکثر ۵۰۰۰ نویسه)." };
  }
  if (!contactInfo || contactInfo.length > 500) {
    return { error: "اطلاعات تماس را وارد کنید (حداکثر ۵۰۰ نویسه)." };
  }
  if (!(image instanceof File) || image.size === 0) {
    return { error: "تصویر طرح موردنظر را انتخاب کنید." };
  }
  const extension = imageTypes.get(image.type);
  if (!extension) {
    return { error: "فرمت تصویر باید JPEG، PNG، WebP یا AVIF باشد." };
  }
  if (image.size > maximumImageSize) {
    return { error: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد." };
  }

  const { data: bucket, error: bucketError } =
    await supabaseAdmin.storage.getBucket("custom-orders");
  if (bucketError) {
    return { error: "باکت custom-orders آماده نیست؛ تنظیمات ذخیره‌سازی را بررسی کنید." };
  }
  if (bucket.public) {
    return { error: "باکت سفارش‌های اختصاصی باید خصوصی باشد." };
  }

  const objectPath = `${tenantId}/${userId}/${crypto.randomUUID()}.${extension}`;
  const { data, error: uploadError } = await supabaseAdmin.storage
    .from("custom-orders")
    .upload(objectPath, image, { contentType: image.type, upsert: false });
  if (uploadError) {
    return { error: `بارگذاری تصویر انجام نشد: ${uploadError.message}` };
  }

  await db.execute({
    sql: `INSERT INTO custom_orders
            (id, tenant_id, customer_id, image_url, description, contact_info)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      tenantId,
      userId,
      data.path,
      description,
      contactInfo,
    ],
  });
  revalidatePath("/profile");
  revalidatePath("/admin/custom-orders");
  return { success: "سفارش اختصاصی شما ثبت شد." };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
