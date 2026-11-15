"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenantModule } from "@/lib/admin-context";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { AUTO_PART_SPEC_KEYS, resolveBusinessKind } from "@/lib/tenant-features";
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
  const { tenantId, tenantName, businessType, enabledModules } =
    await requireTenantModule("ecommerce");
  const businessKind = resolveBusinessKind(businessType, enabledModules);
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const description = readText(formData, "description");
  const condition = readText(formData, "condition");
  const categoryId = readText(formData, "category_id") || null;
  const price = Number(readText(formData, "price"));
  const weight = Number(readText(formData, "weight"));
  const laborPercentage = Number(readText(formData, "labor_percentage"));
  const isVisible = formData.get("is_visible") === "on";
  const specificationKeys = formData.getAll("specification_keys");
  const specificationValues = formData.getAll("specification_values");
  const customFieldKeys = formData.getAll("custom_field_keys");
  const customFieldValues = formData.getAll("custom_field_values");

  if (!name || name.length > 160) {
    return { error: "نام محصول را وارد کنید (حداکثر ۱۶۰ نویسه)." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "قیمت باید عددی بزرگ‌تر از صفر باشد." };
  }
  if (businessKind === "gold" && (!Number.isFinite(weight) || weight <= 0)) {
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
  if (
    specificationKeys.length !== specificationValues.length ||
    specificationKeys.length > 30
  ) {
    return { error: "مشخصات محصول معتبر نیست." };
  }
  const specifications: Record<string, string> = {};
  for (let index = 0; index < specificationKeys.length; index += 1) {
    const key = String(specificationKeys[index]).trim();
    const value = String(specificationValues[index]).trim();
    if (!key && !value) {
      continue;
    }
    if (!key || !value || key.length > 80 || value.length > 300) {
      return { error: "نام و مقدار هر مشخصه را کامل و کوتاه وارد کنید." };
    }
    if (specifications[key]) {
      return { error: "نام مشخصه‌ها نباید تکراری باشد." };
    }
    specifications[key] = value;
  }
  if (
    customFieldKeys.length !== customFieldValues.length ||
    customFieldKeys.length > 30
  ) {
    return { error: "فیلدهای اختصاصی محصول معتبر نیستند." };
  }
  if (businessKind === "auto_parts") {
    for (const [field, label] of Object.entries(AUTO_PART_SPEC_KEYS)) {
      const value = readText(formData, field);
      if (value.length > 300) {
        return { error: `مقدار «${label}» نباید بیشتر از ۳۰۰ نویسه باشد.` };
      }
      if (value) {
        specifications[label] = value;
      }
    }
  }
  const customFields: Record<string, string> = {};
  for (let index = 0; index < customFieldKeys.length; index += 1) {
    const key = String(customFieldKeys[index]).trim();
    const value = String(customFieldValues[index]).trim();
    if (!key && !value) continue;
    if (!key || !value || key.length > 80 || value.length > 300) {
      return { error: "نام و مقدار هر فیلد اختصاصی را کامل و کوتاه وارد کنید." };
    }
    if (customFields[key]) {
      return { error: "نام فیلدهای اختصاصی نباید تکراری باشد." };
    }
    customFields[key] = value;
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

  let images: string[] = [];
  if (id) {
    const existing = await db.execute({
      sql: "SELECT image_url, images FROM products WHERE id = ? AND tenant_id = ?",
      args: [id, tenantId],
    });
    if (existing.rows.length === 0) {
      return { error: "محصول پیدا نشد." };
    }
    images = parseImageArray(existing.rows[0].images);
    if (!images.length && existing.rows[0].image_url !== null) {
      images = [String(existing.rows[0].image_url)];
    }
  }
  if (formData.get("clear_images") === "on") {
    images = [];
  }

  const imageEntries = [
    ...formData.getAll("images"),
    formData.get("image"),
  ].filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (imageEntries.length > 5 || imageEntries.reduce((sum, image) => sum + image.size, 0) > maximumImageSize) {
    return { error: "حداکثر ۵ تصویر با مجموع حجم ۵ مگابایت می‌توانید بارگذاری کنید." };
  }
  if (images.length + imageEntries.length > 5) {
    return { error: "هر محصول حداکثر می‌تواند ۵ تصویر داشته باشد؛ تصاویر قبلی را حذف کنید." };
  }
  if (imageEntries.length) {
    for (const imageEntry of imageEntries) {
      const extension = imageTypes.get(imageEntry.type);
      if (!extension) {
        return { error: "فرمت تصاویر باید JPEG، PNG، WebP یا AVIF باشد." };
      }
    }
    const supabaseAdmin = await getSupabaseAdminClient();
    const { data: bucket, error: bucketError } =
      await supabaseAdmin.storage.getBucket("products");
    if (bucketError) {
      return { error: "باکت products در Supabase Storage در دسترس نیست." };
    }
    if (!bucket.public) {
      return { error: "برای نمایش تصویر محصول، باکت products باید عمومی باشد." };
    }
    for (const imageEntry of imageEntries) {
      const extension = imageTypes.get(imageEntry.type);
      if (!extension) {
        throw new Error("فرمت تصویر پس از اعتبارسنجی تغییر کرده است.");
      }
      const objectPath = `${tenantId}/${crypto.randomUUID()}.${extension}`;
      const { data, error } = await supabaseAdmin.storage
        .from("products")
        .upload(objectPath, imageEntry, {
          contentType: imageEntry.type,
          upsert: false,
        });
      if (error) {
        throw new Error(`بارگذاری تصویر انجام نشد: ${error.message}`);
      }
      images.push(
        supabaseAdmin.storage.from("products").getPublicUrl(data.path).data.publicUrl,
      );
    }
  }
  if (images.length > 5) {
    return { error: "هر محصول حداکثر می‌تواند ۵ تصویر داشته باشد." };
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
    image_url: images[0] ?? null,
    images: JSON.stringify(images),
    custom_fields: JSON.stringify(customFields),
    category_id: categoryId,
    is_visible: Number(isVisible),
    is_active: Number(isVisible),
    condition,
    labor_percentage: laborPercentage,
    specifications: JSON.stringify(specifications),
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
  const { tenantId } = await requireTenantModule("ecommerce");
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
      sql: `SELECT 1 FROM ${String(row.name)}
            WHERE product_id = ? AND tenant_id = ? LIMIT 1`,
      args: [id, tenantId],
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

function parseImageArray(value: unknown): string[] {
  let parsed: unknown;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new Error("فهرست تصاویر ذخیره‌شده محصول معتبر نیست.");
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === "string")
  ) {
    throw new Error("فهرست تصاویر ذخیره‌شده محصول معتبر نیست.");
  }
  return parsed;
}
