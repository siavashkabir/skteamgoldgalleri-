import "server-only";

import { getDbClient } from "@/lib/db";
import {
  DEFAULT_STORE_SLUG,
  DEFAULT_TENANT_ID,
  type StorefrontCategory,
  type StorefrontProduct,
  type StorefrontStore,
} from "@/lib/storefront-types";
import { DEFAULT_THEME_SETTINGS, parseThemeSettings } from "@/lib/theme-settings";
import { getOptionalAuthenticatedProfile } from "@/lib/admin-context";
import { parseTenantModules } from "@/lib/tenant-modules";

type StorefrontDatabase = Awaited<ReturnType<typeof getDbClient>>;

const fallbackDefaultStore: StorefrontStore = {
  show_header_widget: 1,
  show_chart: 1,
  chart_type: "line",
  chart_color: "#d4af37",
  enabled_currencies: '["USD","XAU","18K","BUBBLE"]',
  category: "retail",
  owner_password: null,
  id: DEFAULT_TENANT_ID,
  slug: DEFAULT_STORE_SLUG,
  name: "گالری طلای امیر",
  description: "",
  instagramUrl: null,
  telegramUrl: null,
  whatsappUrl: null,
  logoUrl: null,
  heroTitle: null,
  heroSubtitle: null,
  phoneNumbers: [],
  addressText: null,
  locationUrl: null,
  socialLinks: {},
  tomanRate: null,
  themeSettings: DEFAULT_THEME_SETTINGS,
  status: "active",
  expiryDate: null,
  templateId: "luxury",
  businessType: null,
  enabledModules: ["ecommerce", "gallery"],
};

let warnedAboutBuildFallback = false;

async function getStorefrontDatabase(): Promise<StorefrontDatabase | null> {
  try {
    return await getDbClient();
  } catch (error) {
    if (
      process.env.NEXT_PHASE !== "phase-production-build" ||
      !(error instanceof Error) ||
      error.message !== "Missing required environment variable: TURSO_DATABASE_URL"
    ) {
      throw error;
    }

    if (!warnedAboutBuildFallback) {
      console.warn(
        "TURSO_DATABASE_URL is missing during the production build; using fallback storefront data.",
      );
      warnedAboutBuildFallback = true;
    }
    return null;
  }
}

export async function getStoreBySlug(
  slug: string,
): Promise<StorefrontStore | null> {
  const db = await getStorefrontDatabase();
  if (!db) {
    return slug.toLowerCase() === DEFAULT_TENANT_ID ||
        slug.toLowerCase() === DEFAULT_STORE_SLUG
      ? fallbackDefaultStore
      : null;
  }

  const shopsTable = await db.execute(
    `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'shops'`,
  );
  const result = shopsTable.rows.length
    ? await db.execute({
        sql:         `SELECT t.id, t.name, t.description, t.instagram_url,
                     t.telegram_url, t.whatsapp_url, t.logo_url, t.hero_title,
                     t.hero_subtitle, t.phone_numbers, t.address_text,
                     t.location_url, t.social_links, t.toman_rate,
                     t.theme_settings, t.status, t.expiry_date, t.template_id,
                     t.business_type, t.enabled_modules
              FROM tenants t
              WHERE lower(t.id) = lower(?)
                 OR lower(COALESCE(t.domain, '')) = lower(?)
                 OR (
                   lower(t.id) = lower(?)
                   AND lower(?) = lower(?)
                 )
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
        args: [
          slug,
          slug,
          DEFAULT_TENANT_ID,
          slug,
          DEFAULT_STORE_SLUG,
          slug,
          slug,
        ],
      })
    : await db.execute({
        sql:         `SELECT id, name, description, instagram_url, telegram_url,
                     whatsapp_url, logo_url, hero_title, hero_subtitle,
                     phone_numbers, address_text, location_url, social_links,
                     toman_rate, theme_settings, status, expiry_date, template_id,
                     business_type, enabled_modules
              FROM tenants
              WHERE lower(id) = lower(?)
                 OR lower(COALESCE(domain, '')) = lower(?)
                 OR (
                   lower(id) = lower(?)
                   AND lower(?) = lower(?)
                 )
              LIMIT 1`,
        args: [slug, slug, DEFAULT_TENANT_ID, slug, DEFAULT_STORE_SLUG],
      });
  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const rawName = String(row.name);
  const tenantId = String(row.id);
  return {
    id: tenantId,
    slug: tenantId.toLowerCase() === DEFAULT_TENANT_ID
      ? DEFAULT_STORE_SLUG
      : tenantId,
    name: tenantId === DEFAULT_TENANT_ID ? "گالری طلای امیر" : rawName,
    description: row.description === null ? "" : String(row.description),
    instagramUrl:
      row.instagram_url === null ? null : String(row.instagram_url),
    telegramUrl: row.telegram_url === null ? null : String(row.telegram_url),
    whatsappUrl: row.whatsapp_url === null ? null : String(row.whatsapp_url),
    logoUrl: row.logo_url === null ? null : String(row.logo_url),
    heroTitle: row.hero_title === null ? null : String(row.hero_title),
    heroSubtitle: row.hero_subtitle === null ? null : String(row.hero_subtitle),
    phoneNumbers: parseStringArray(row.phone_numbers),
    addressText: row.address_text === null ? null : String(row.address_text),
    locationUrl: row.location_url === null ? null : String(row.location_url),
    socialLinks: parseStringRecord(row.social_links),
    tomanRate: row.toman_rate === null ? null : Number(row.toman_rate),
    themeSettings: parseThemeSettings(row.theme_settings),
    status: readTenantStatus(row.status),
    expiryDate: row.expiry_date === null ? null : String(row.expiry_date),
    templateId: readTemplateId(row.template_id),
    businessType:
      row.business_type === null ? null : String(row.business_type),
    enabledModules: parseTenantModules(row.enabled_modules),
  };
}

export async function getStorefrontBanner(): Promise<string> {
  const db = await getStorefrontDatabase();
  if (!db) {
    return "";
  }
  const result = await db.execute(
    "SELECT banner_text FROM master_settings WHERE id = 'global' LIMIT 1",
  );
  return result.rows[0]?.banner_text == null
    ? ""
    : String(result.rows[0].banner_text);
}

export async function getStorefrontCatalog(tenantId: string): Promise<{
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
}> {
  const db = await getStorefrontDatabase();
  if (!db) {
    return { categories: [], products: [] };
  }

  const [categoryResult, productColumnsResult] = await Promise.all([
    db.execute({
      sql: "SELECT id, name, parent_id FROM categories WHERE tenant_id = ? ORDER BY name",
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
                 ${categoryNameExpression} AS category_name,
                 ${columns.has("specifications") ? "p.specifications" : "'{}'"} AS specifications,
                 ${columns.has("custom_fields") ? "p.custom_fields" : "'{}'"} AS custom_fields,
                 ${columns.has("images") ? "p.images" : "'[]'"} AS images,
                 r.rating_average, COALESCE(r.rating_count, 0) AS rating_count
          FROM products p
          ${categoryJoin}
          LEFT JOIN (
            SELECT product_id, AVG(rating) AS rating_average, COUNT(*) AS rating_count
            FROM reviews
            WHERE tenant_id = ?
            GROUP BY product_id
          ) r ON r.product_id = p.id
          WHERE p.tenant_id = ? AND p.is_visible = 1
          ORDER BY p.id DESC`,
    args: [tenantId, tenantId],
  });

  return {
    categories: categoryResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      parentId: row.parent_id === null ? null : String(row.parent_id),
      slug: categorySlug(String(row.name)),
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
      specifications: parseStringRecord(row.specifications),
      customFields: parseStringRecord(row.custom_fields),
      images: parseStringArray(row.images),
      ratingAverage:
        row.rating_average === null ? null : Number(row.rating_average),
      ratingCount: Number(row.rating_count),
    })),
  };
}

export async function getStorefrontCategories(
  tenantId: string,
): Promise<StorefrontCategory[]> {
  const db = await getStorefrontDatabase();
  if (!db) {
    return [];
  }

  const result = await db.execute({
    sql: "SELECT id, name, parent_id FROM categories WHERE tenant_id = ? ORDER BY name",
    args: [tenantId],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    parentId: row.parent_id === null ? null : String(row.parent_id),
    slug: categorySlug(String(row.name)),
  }));
}

export async function getVisibleProduct(
  tenantId: string,
  productId: string,
): Promise<StorefrontProduct | null> {
  const db = await getStorefrontDatabase();
  if (!db) {
    return null;
  }

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
                 ${categoryNameExpression} AS category_name,
                 ${columns.has("specifications") ? "p.specifications" : "'{}'"} AS specifications,
                 ${columns.has("custom_fields") ? "p.custom_fields" : "'{}'"} AS custom_fields,
                 ${columns.has("images") ? "p.images" : "'[]'"} AS images,
                 r.rating_average, COALESCE(r.rating_count, 0) AS rating_count
          FROM products p
          ${categoryJoin}
          LEFT JOIN (
            SELECT product_id, AVG(rating) AS rating_average, COUNT(*) AS rating_count
            FROM reviews
            WHERE tenant_id = ?
            GROUP BY product_id
          ) r ON r.product_id = p.id
          WHERE p.tenant_id = ? AND p.id = ? AND p.is_visible = 1
          LIMIT 1`,
    args: [tenantId, tenantId, productId],
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
        specifications: parseStringRecord(row.specifications),
        customFields: parseStringRecord(row.custom_fields),
        images: parseStringArray(row.images),
        ratingAverage:
          row.rating_average === null ? null : Number(row.rating_average),
        ratingCount: Number(row.rating_count),
      }
    : null;
}

export async function getStorefrontCustomerState(tenantId: string): Promise<{
  wishlistedProductIds: string[];
} | null> {
  const db = await getStorefrontDatabase();
  if (!db) {
    return null;
  }

  const profile = await getOptionalAuthenticatedProfile();
  if (
    !profile ||
    profile.role !== "customer" ||
    profile.tenantId !== tenantId
  ) {
    return null;
  }

  const result = await db.execute({
    sql: "SELECT product_id FROM wishlist WHERE tenant_id = ? AND customer_id = ?",
    args: [tenantId, profile.userId],
  });
  return {
    wishlistedProductIds: result.rows.map((row) => String(row.product_id)),
  };
}

function parseStringArray(value: unknown): string[] {
  let parsed: unknown;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new Error("فهرست JSON ذخیره‌شده فروشگاه معتبر نیست.");
  }
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("فهرست JSON ذخیره‌شده فروشگاه معتبر نیست.");
  }
  return parsed;
}

function readTenantStatus(value: unknown): StorefrontStore["status"] {
  if (value === "trial" || value === "suspended") {
    return value;
  }
  return "active";
}

function readTemplateId(value: unknown): StorefrontStore["templateId"] {
  if (
    value === "minimal" ||
    value === "classic" ||
    value === "medical" ||
    value === "tourism" ||
    value === "corporate"
  ) {
    return value;
  }
  return "luxury";
}

function parseStringRecord(value: unknown): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new Error("مقدار JSON تنظیمات فروشگاه معتبر نیست.");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !Object.values(parsed).every((item) => typeof item === "string")
  ) {
    throw new Error("مقدار JSON تنظیمات فروشگاه معتبر نیست.");
  }
  return parsed as Record<string, string>;
}

export function categorySlug(name: string): string {
  return name.trim().toLocaleLowerCase("fa").replace(/\s+/g, "-");
}
