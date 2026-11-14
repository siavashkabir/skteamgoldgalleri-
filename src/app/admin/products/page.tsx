import { Suspense } from "react";
import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";
import ProductManager, {
  type AdminProduct,
} from "./product-manager";
import type { AdminCategory } from "../categories/category-manager";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />}>
      <Products />
    </Suspense>
  );
}

async function Products() {
  const { tenantId } = await getTenantAdminContext();
  const [productResult, categoryResult] = await Promise.all([
    db.execute({
      sql: `SELECT id, name, price, weight, description, image_url,
                 category_id, is_visible, condition, labor_percentage,
                 specifications
            FROM products WHERE tenant_id = ? ORDER BY name`,
      args: [tenantId],
    }),
    db.execute({
      sql: `SELECT id, name, parent_id FROM categories
            WHERE tenant_id = ? ORDER BY name`,
      args: [tenantId],
    }),
  ]);
  const products: AdminProduct[] = productResult.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    price: Number(row.price ?? 0),
    weight: Number(row.weight ?? 0),
    description: row.description === null ? "" : String(row.description),
    imageUrl: row.image_url === null ? null : String(row.image_url),
    categoryId: row.category_id === null ? null : String(row.category_id),
    isVisible: Number(row.is_visible) === 1,
    condition: row.condition === "used" ? "used" : "new",
    laborPercentage: Number(row.labor_percentage ?? 0),
    specifications: parseSpecifications(row.specifications),
  }));
  const categories: AdminCategory[] = categoryResult.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    parentId: row.parent_id === null ? null : String(row.parent_id),
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">محصولات</h1>
      <p className="mt-2 text-sm text-[#969387]">
        مشخصات، تصویر، قیمت و وضعیت نمایش محصولات را مدیریت کنید.
      </p>
      <ProductManager categories={categories} products={products} />
    </div>
  );
}

function parseSpecifications(value: unknown): Record<string, string> {
  const parsed: unknown = JSON.parse(typeof value === "string" ? value : "{}");
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !Object.values(parsed).every((item) => typeof item === "string")
  ) {
    throw new Error("مشخصات ذخیره‌شده محصول معتبر نیست.");
  }
  return parsed as Record<string, string>;
}
