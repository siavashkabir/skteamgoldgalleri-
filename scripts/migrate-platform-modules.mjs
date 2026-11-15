import { createClient } from "@libsql/client";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const client = createClient({
  url: requiredEnv("TURSO_DATABASE_URL"),
  authToken: requiredEnv("TURSO_AUTH_TOKEN"),
});

async function ensureColumn(table, column, definition) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  if (!result.rows.some((row) => row.name === column)) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

try {
  const tenants = await client.execute("PRAGMA table_info(tenants)");
  const products = await client.execute("PRAGMA table_info(products)");
  if (!tenants.rows.length || !products.rows.length) {
    throw new Error("Run db:init before applying platform modules migration.");
  }

  for (const [column, definition] of [
    ["business_type", "TEXT"],
    ["enabled_modules", `TEXT NOT NULL DEFAULT '["ecommerce","gallery"]'`],
    ["kyc_data", "TEXT NOT NULL DEFAULT '{}'"],
    ["license_url", "TEXT"],
    ["legal_agreed_at", "TEXT"],
  ]) {
    await ensureColumn("tenants", column, definition);
  }
  for (const [column, definition] of [
    ["custom_fields", "TEXT NOT NULL DEFAULT '{}'"],
    ["images", "TEXT NOT NULL DEFAULT '[]'"],
  ]) {
    await ensureColumn("products", column, definition);
  }

  await client.execute(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_id TEXT,
    booking_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  )`);

  const [verifiedTenants, verifiedProducts, verifiedBookings] = await Promise.all([
    client.execute("PRAGMA table_info(tenants)"),
    client.execute("PRAGMA table_info(products)"),
    client.execute(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'bookings'`,
    ),
  ]);
  const tenantColumns = new Set(verifiedTenants.rows.map((row) => row.name));
  const productColumns = new Set(verifiedProducts.rows.map((row) => row.name));
  const missing = [
    ...["business_type", "enabled_modules", "kyc_data", "license_url", "legal_agreed_at"]
      .filter((column) => !tenantColumns.has(column))
      .map((column) => `tenants.${column}`),
    ...["custom_fields", "images"]
      .filter((column) => !productColumns.has(column))
      .map((column) => `products.${column}`),
  ];
  if (missing.length || !verifiedBookings.rows.length) {
    throw new Error(
      `Platform modules migration verification failed: ${missing.join(", ") || "bookings"}`,
    );
  }

  console.log("Verified tenant onboarding, product custom fields/images, and bookings schema.");
} finally {
  await client.close();
}
