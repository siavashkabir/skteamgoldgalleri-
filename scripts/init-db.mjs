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

const schema = [
  `CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    description TEXT,
    instagram_url TEXT,
    telegram_url TEXT,
    whatsapp_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    role TEXT NOT NULL,
    full_name TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES categories(id)
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    weight REAL,
    description TEXT,
    image_url TEXT,
    category_id TEXT REFERENCES categories(id),
    is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
    condition TEXT NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used')),
    labor_percentage REAL NOT NULL DEFAULT 0 CHECK (labor_percentage >= 0)
  )`,
];

async function ensureColumn(table, column, definition) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  const columns = new Set(result.rows.map((row) => row.name));
  if (!columns.has(column)) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

try {
  await client.batch(schema, "write");

  for (const [column, definition] of [
    ["description", "TEXT"],
    ["instagram_url", "TEXT"],
    ["telegram_url", "TEXT"],
    ["whatsapp_url", "TEXT"],
  ]) {
    await ensureColumn("tenants", column, definition);
  }

  for (const [column, definition] of [
    ["tenant_id", "TEXT REFERENCES tenants(id)"],
    ["name", "TEXT"],
    ["category_id", "TEXT REFERENCES categories(id)"],
    ["is_visible", "INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1))"],
    ["condition", "TEXT NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used'))"],
    ["labor_percentage", "REAL NOT NULL DEFAULT 0 CHECK (labor_percentage >= 0)"],
  ]) {
    await ensureColumn("products", column, definition);
  }

  const productColumns = new Set(
    (await client.execute("PRAGMA table_info(products)")).rows.map(
      (row) => row.name,
    ),
  );
  if (productColumns.has("title")) {
    await client.execute(
      "UPDATE products SET name = title WHERE name IS NULL AND title IS NOT NULL",
    );
  }
  if (productColumns.has("is_active")) {
    await client.execute(
      "UPDATE products SET is_visible = is_active WHERE is_active IS NOT NULL",
    );
  }

  const result = await client.execute(
    `SELECT name FROM sqlite_master
     WHERE type = 'table'
       AND name IN ('tenants', 'profiles', 'categories', 'products')`,
  );
  const createdTables = new Set(result.rows.map((row) => row.name));
  const expectedTables = ["tenants", "profiles", "categories", "products"];
  const missingTables = expectedTables.filter(
    (table) => !createdTables.has(table),
  );

  if (missingTables.length > 0) {
    throw new Error(`Table verification failed: ${missingTables.join(", ")}`);
  }

  console.log(`Verified tables: ${expectedTables.join(", ")}`);
} finally {
  await client.close();
}
