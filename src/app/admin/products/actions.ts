"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantAdminContext } from "@/lib/admin-context";
import { supabaseAdmin } from "@/lib/supabase";
import type { AdminActionState } from "../action-state";

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const maximumImageSize = 5 * 1024 * 1024;

export async function saveProduct(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { tenantId, tenantName } = await getTenantAdminContext();
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const description = readText(formData, "description");
  const condition = readText(formData, "condition");
  const categoryId = readText(formData, "category_id") || null;
  const price = Number(readText(formData, "price"));
  const weight = Number(readText(formData, "weight"));
  const laborPercentage = Number(readText(formData, "labor_percentage"));
  const isVisible = formData.get("is_visible") === "on";

  if (!name || name.length > 160) {
    return { error: "نام محصول را وارد کنید (حداکثر ۱۶۰ نویسه)." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "قیمت باید عددی بزرگ‌تر از صفر باشد." };
  }
  if (!Number.isFinite(weight) || weight <= 0) {
    return { error: "وزن باید عددی بزرگ‌تر از صفر باشد." };
  }
  if (!Number.isFinite(laborPercentage) || laborPercentage < 0) {
    return { error: "درصد کارمزد معتبر نیست." };
  }
  if (condition !== "new" && condition !== "used") {
    return { error: "وضعیت محصول معتبر نیست." };
  }
  if (description.length > 20000) {
    return { error: "توضیحات نباید بیشتر از ۲۰۰۰۰ نویسه باشد." };
  }

  if (categoryId) {
    const category = await db.execute({
      sql: "SELECT id FROM categories WHERE id = ? AND tenant_id = ?",
      args: [categoryId, tenantId],
    });
    if (category.rows.length === 0) {
      return { error: "دسته‌بندی انتخاب‌شده معتبر نیست." };
    }
  }

  let existingImageUrl = readText(formData, "existing_image_url") || null;
  if (id) {
    const existing = await db.execute({
      sql: "SELECT image_url FROM products WHERE id = ? AND tenant_id = ?",
      args: [id, tenantId],
    });
    if (existing.rows.length === 0) {
      return { error: "محصول پیدا نشد." };
    }
    existingImageUrl =
      existing.rows[0].image_url === null
        ? null
        : String(existing.rows[0].image_url);
  }
  if (formData.get("clear_image") === "on") {
    existingImageUrl = null;
  }

  const imageEntry = formData.get("image");
  if (imageEntry instanceof File && imageEntry.size > 0) {
    const extension = imageTypes.get(imageEntry.type);
    if (!extension) {
      return { error: "فرمت تصویر باید JPEG، PNG، WebP یا AVIF باشد." };
    }
    if (imageEntry.size > maximumImageSize) {
      return { error: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد." };
    }

    const { data: bucket, error: bucketError } =
      await supabaseAdmin.storage.getBucket("products");
    if (bucketError) {
      return { error: "باکت products در Supabase Storage در دسترس نیست." };
    }
    if (!bucket.public) {
      return { error: "برای نمایش تصویر محصول، باکت products باید عمومی باشد." };
    }

    const objectPath = `${tenantId}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabaseAdmin.storage
      .from("products")
      .upload(objectPath, imageEntry, {
        contentType: imageEntry.type,
        upsert: false,
      });
    if (error) {
      return { error: `بارگذاری تصویر انجام نشد: ${error.message}` };
    }
    existingImageUrl = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(data.path).data.publicUrl;
  }

  const result = await db.execute("PRAGMA table_info(products)");
  const productColumns = new Map(
    result.rows.map((row) => [String(row.name), row]),
  );
  const values: Record<string, string | number | null> = {
    tenant_id: tenantId,
    name,
    title: name,
    price,
    weight,
    description: description || null,
    image_url: existingImageUrl,
    category_id: categoryId,
    is_visible: Number(isVisible),
    is_active: Number(isVisible),
    condition,
    labor_percentage: laborPercentage,
  };

  if (productColumns.has("shop_id")) {
    let shop = await db.execute({
      sql: "SELECT id FROM shops WHERE name = ? ORDER BY id LIMIT 2",
      args: [tenantName],
    });
    if (shop.rows.length === 0) {
      shop = await db.execute("SELECT id FROM shops ORDER BY id LIMIT 2");
    }
    if (shop.rows.length !== 1) {
      return { error: "برای محصولات، ابتدا فروشگاه را در جدول shops تعریف کنید." };
    }
    values.shop_id = Number(shop.rows[0].id);
  }

  if (id) {
    const assignments = Object.keys(values)
      .filter((column) => productColumns.has(column))
      .map((column) => `${column} = ?`);
    const args = Object.entries(values)
      .filter(([column]) => productColumns.has(column))
      .map(([, value]) => value);
    await db.execute({
      sql: `UPDATE products SET ${assignments.join(", ")} WHERE id = ? AND tenant_id = ?`,
      args: [...args, id, tenantId],
    });
  } else {
    const entries = Object.entries(values).filter(([column]) =>
      productColumns.has(column),
    );
    const integerId = String(productColumns.get("id")?.type)
      .toUpperCase()
      .includes("INT");
    const columns = entries.map(([column]) => column);
    const args = entries.map(([, value]) => value);
    if (!integerId) {
      columns.unshift("id");
      args.unshift(crypto.randomUUID());
    }
    await db.execute({
      sql: `INSERT INTO products (${columns.join(", ")})
            VALUES (${columns.map(() => "?").join(", ")})`,
      args,
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return { success: id ? "محصول ویرایش شد." : "محصول اضافه شد." };
}

export async function deleteProduct(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { tenantId } = await getTenantAdminContext();
  const id = readText(formData, "id");
  if (!id) {
    return { error: "شناسه محصول معتبر نیست." };
  }

  const dependencies = await db.execute(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name IN ('cart_items', 'order_items')`,
  );
  for (const row of dependencies.rows) {
    const dependency = await db.execute({
      sql: `SELECT 1 FROM ${String(row.name)} WHERE product_id = ? LIMIT 1`,
      args: [id],
    });
    if (dependency.rows.length > 0) {
      return { error: "این محصول در سبد خرید یا سفارش ثبت شده و قابل حذف نیست." };
    }
  }

  const result = await db.execute({
    sql: "DELETE FROM products WHERE id = ? AND tenant_id = ?",
    args: [id, tenantId],
  });
  if (result.rowsAffected === 0) {
    return { error: "محصول پیدا نشد." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return { success: "محصول حذف شد." };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
