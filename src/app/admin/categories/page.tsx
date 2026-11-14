import { Suspense } from "react";
import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";
import CategoryManager, { type AdminCategory } from "./category-manager";

export const runtime = "edge";

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />}>
      <Categories />
    </Suspense>
  );
}

async function Categories() {
  const { tenantId } = await getTenantAdminContext();
  const result = await db.execute({
    sql: `SELECT id, name, parent_id FROM categories
          WHERE tenant_id = ? ORDER BY name`,
    args: [tenantId],
  });
  const categories: AdminCategory[] = result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    parentId: row.parent_id === null ? null : String(row.parent_id),
  }));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const children = new Map<string | null, AdminCategory[]>();
  for (const category of categories) {
    const parentId =
      category.parentId && categoryMap.has(category.parentId)
        ? category.parentId
        : null;
    children.set(parentId, [...(children.get(parentId) ?? []), category]);
  }

  const flattened: Array<AdminCategory & { depth: number }> = [];
  function visit(parentId: string | null, depth: number, ancestors: Set<string>) {
    for (const category of children.get(parentId) ?? []) {
      if (ancestors.has(category.id)) {
        continue;
      }
      flattened.push({ ...category, depth });
      visit(category.id, depth + 1, new Set([...ancestors, category.id]));
    }
  }
  visit(null, 0, new Set());

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">دسته‌بندی‌ها</h1>
      <p className="mt-2 text-sm text-[#969387]">
        دسته‌بندی‌های تو‌در‌تو بسازید و آن‌ها را به محصولات متصل کنید.
      </p>
      <CategoryManager categories={categories} flattened={flattened} />
    </div>
  );
}
