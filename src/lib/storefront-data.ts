import "server-only";

import { db } from "@/lib/db";
import {
  DEFAULT_STORE_SLUG,
  type StorefrontCategory,
  type StorefrontProduct,
  type StorefrontStore,
} from "@/lib/storefront-types";

export async function getStoreBySlug(
  slug: string,
): Promise<StorefrontStore | null> {
  const shopsTable = await db.execute(
    `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'shops'`,
  );
  const result = shopsTable.rows.length
    ? await db.execute({
        sql: `SELECT t.id, t.name, t.description, t.instagram_url,
                     t.telegram_url, t.whatsapp_url,
                     COALESCE(
                       (SELECT slug FROM shops WHERE name = t.name LIMIT 1),
                       (SELECT slug FROM shops ORDER BY id LIMIT 1),
                       ?
                     ) AS shop_slug
              FROM tenants t
              WHERE lower(t.id) = lower(?)
                 OR lower(COALESCE(t.domain, '')) = lower(?)
                 OR EXISTS (
                   SELECT 1 FROM shops s
                   WHERE lower(s.slug) = lower(?)
                     AND (
                       s.name = t.name
                       OR (SELECT COUNT(*) FROM tenants) = 1
                     )
                 )
              ORDER BY CASE
                WHEN lower(t.id) = lower(?) THEN 0
                ELSE 1
              END
              LIMIT 1`,
        args: [DEFAULT_STORE_SLUG, slug, slug, slug, slug],
      })
    : await db.execute({
        sql: `SELECT id, name, description, instagram_url, telegram_url,
                     whatsapp_url, id AS shop_slug
              FROM tenants
              WHERE lower(id) = lower(?)
                 OR lower(COALESCE(domain, '')) = lower(?)
              LIMIT 1`,
        args: [slug, slug],
      });
  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const rawName = String(row.name);
  return {
    id: String(row.id),
    slug: String(row.shop_slug || slug),
    name: String(row.id) === "team-gold-system" ? "گالری طلای امیر" : rawName,
    description: row.description === null ? "" : String(row.description),
    instagramUrl:
      row.instagram_url === null ? null : String(row.instagram_url),
    telegramUrl: row.telegram_url === null ? null : String(row.telegram_url),
    whatsappUrl: row.whatsapp_url === null ? null : String(row.whatsapp_url),
  };
}

export async function getStorefrontCatalog(tenantId: string): Promise<{
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
}> {
  const [categoryResult, productColumnsResult] = await Promise.all([
    db.execute({
      sql: "SELECT id, name FROM categories WHERE tenant_id = ? ORDER BY name",
      args: [tenantId],
    }),
    db.execute("PRAGMA table_info(products)"),
  ]);
  const columns = new Set(
    productColumnsResult.rows.map((row) => String(row.name)),
  );
  const nameColumn = columns.has("name") ? "name" : "title";
  const descriptionColumn = columns.has("description")
    ? "p.description"
    : "NULL";
  const imageColumn = columns.has("image_url") ? "p.image_url" : "NULL";
  const categoryIdColumn = columns.has("category_id") ? "p.category_id" : "NULL";
  const categoryJoin = columns.has("category_id")
    ? "LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id"
    : "";
  const categoryNameExpression = columns.has("category_id")
    ? columns.has("category")
      ? "COALESCE(c.name, p.category)"
      : "c.name"
    : columns.has("category")
      ? "p.category"
      : "NULL";
  const productResult = await db.execute({
    sql: `SELECT p.id, p.${nameColumn} AS product_name, p.price, p.weight,
                 ${descriptionColumn} AS description,
                 ${imageColumn} AS image_url,
                 ${categoryIdColumn} AS category_id,
                 ${categoryNameExpression} AS category_name
          FROM products p
          ${categoryJoin}
          WHERE p.tenant_id = ? AND p.is_visible = 1
          ORDER BY p.id DESC`,
    args: [tenantId],
  });

  return {
    categories: categoryResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
    })),
    products: productResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.product_name ?? ""),
      price: row.price === null ? null : Number(row.price),
      weight: row.weight === null ? null : Number(row.weight),
      description: row.description === null ? "" : String(row.description),
      imageUrl: row.image_url === null ? null : String(row.image_url),
      categoryId: row.category_id === null ? null : String(row.category_id),
      categoryName:
        row.category_name === null ? null : String(row.category_name),
    })),
  };
}

export async function getVisibleProduct(
  tenantId: string,
  productId: string,
): Promise<StorefrontProduct | null> {
  const productColumnsResult = await db.execute("PRAGMA table_info(products)");
  const columns = new Set(
    productColumnsResult.rows.map((row) => String(row.name)),
  );
  const nameColumn = columns.has("name") ? "name" : "title";
  const descriptionColumn = columns.has("description")
    ? "description"
    : "NULL";
  const imageColumn = columns.has("image_url") ? "image_url" : "NULL";
  const categoryIdColumn = columns.has("category_id") ? "category_id" : "NULL";
  const categoryJoin = columns.has("category_id")
    ? "LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id"
    : "";
  const categoryNameExpression = columns.has("category_id")
    ? columns.has("category")
      ? "COALESCE(c.name, p.category)"
      : "c.name"
    : columns.has("category")
      ? "p.category"
      : "NULL";
  const result = await db.execute({
    sql: `SELECT p.id, p.${nameColumn} AS product_name, p.price, p.weight,
                 ${descriptionColumn} AS description,
                 ${imageColumn} AS image_url,
                 ${categoryIdColumn} AS category_id,
                 ${categoryNameExpression} AS category_name
          FROM products p
          ${categoryJoin}
          WHERE p.tenant_id = ? AND p.id = ? AND p.is_visible = 1
          LIMIT 1`,
    args: [tenantId, productId],
  });
  const row = result.rows[0];
  return row
    ? {
        id: String(row.id),
        name: String(row.product_name ?? ""),
        price: row.price === null ? null : Number(row.price),
        weight: row.weight === null ? null : Number(row.weight),
        description: row.description === null ? "" : String(row.description),
        imageUrl: row.image_url === null ? null : String(row.image_url),
        categoryId: row.category_id === null ? null : String(row.category_id),
        categoryName:
          row.category_name === null ? null : String(row.category_name),
      }
    : null;
}
