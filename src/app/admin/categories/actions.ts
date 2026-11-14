"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantAdminContext } from "@/lib/admin-context";
import type { AdminActionState } from "../action-state";

export async function saveCategory(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { tenantId } = await getTenantAdminContext();
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const parentId = readText(formData, "parent_id") || null;

  if (!name || name.length > 100) {
    return { error: "نام دسته‌بندی را وارد کنید (حداکثر ۱۰۰ نویسه)." };
  }

  const existing = await db.execute({
    sql: "SELECT id FROM categories WHERE id = ? AND tenant_id = ?",
    args: [id, tenantId],
  });
  if (id && existing.rows.length === 0) {
    return { error: "دسته‌بندی پیدا نشد." };
  }

  const categoriesResult = await db.execute({
    sql: "SELECT id, parent_id FROM categories WHERE tenant_id = ?",
    args: [tenantId],
  });
  const parents = new Map(
    categoriesResult.rows.map((row) => [
      String(row.id),
      row.parent_id === null ? null : String(row.parent_id),
    ]),
  );

  if (parentId) {
    if (!parents.has(parentId)) {
      return { error: "دسته‌بندی والد معتبر نیست." };
    }

    const visited = new Set<string>();
    let current: string | null = parentId;
    while (current) {
      if (current === id || visited.has(current)) {
        return { error: "ساختار والد و فرزند نمی‌تواند حلقه ایجاد کند." };
      }
      visited.add(current);
      current = parents.get(current) ?? null;
    }
  }

  if (id) {
    await db.execute({
      sql: `UPDATE categories SET name = ?, parent_id = ?
            WHERE id = ? AND tenant_id = ?`,
      args: [name, parentId, id, tenantId],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO categories (id, tenant_id, name, parent_id)
            VALUES (?, ?, ?, ?)`,
      args: [crypto.randomUUID(), tenantId, name, parentId],
    });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { success: id ? "دسته‌بندی ویرایش شد." : "دسته‌بندی اضافه شد." };
}

export async function deleteCategory(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { tenantId } = await getTenantAdminContext();
  const id = readText(formData, "id");
  if (!id) {
    return { error: "شناسه دسته‌بندی معتبر نیست." };
  }

  const category = await db.execute({
    sql: "SELECT id FROM categories WHERE id = ? AND tenant_id = ?",
    args: [id, tenantId],
  });
  if (category.rows.length === 0) {
    return { error: "دسته‌بندی پیدا نشد." };
  }

  const [children, products] = await Promise.all([
    db.execute({
      sql: "SELECT 1 FROM categories WHERE parent_id = ? AND tenant_id = ? LIMIT 1",
      args: [id, tenantId],
    }),
    db.execute({
      sql: "SELECT 1 FROM products WHERE category_id = ? AND tenant_id = ? LIMIT 1",
      args: [id, tenantId],
    }),
  ]);
  if (children.rows.length > 0) {
    return { error: "ابتدا زیرمجموعه‌های این دسته‌بندی را حذف یا جابه‌جا کنید." };
  }
  if (products.rows.length > 0) {
    return { error: "این دسته‌بندی به محصول متصل است و قابل حذف نیست." };
  }

  await db.execute({
    sql: "DELETE FROM categories WHERE id = ? AND tenant_id = ?",
    args: [id, tenantId],
  });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { success: "دسته‌بندی حذف شد." };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
