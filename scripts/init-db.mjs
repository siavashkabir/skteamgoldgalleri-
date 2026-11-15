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
    logo_url TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    phone_numbers TEXT NOT NULL DEFAULT '[]',
    address_text TEXT,
    location_url TEXT,
    social_links TEXT NOT NULL DEFAULT '{}',
    toman_rate REAL,
    instagram_url TEXT,
    telegram_url TEXT,
    whatsapp_url TEXT,
    theme_settings TEXT NOT NULL DEFAULT '{"primary":"#d4af37","background":"#0a0a0a","text":"#ffffff","accent":"#e2c16d","card":"#151514","bgImageUrl":null,"bgOpacity":45}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended')),
    expiry_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    role TEXT NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    national_id TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT
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
    labor_percentage REAL NOT NULL DEFAULT 0 CHECK (labor_percentage >= 0),
    specifications TEXT NOT NULL DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    customer_id TEXT NOT NULL REFERENCES profiles(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (tenant_id, customer_id, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    customer_id TEXT NOT NULL REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending',
    total REAL NOT NULL DEFAULT 0,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    shipping_city TEXT,
    shipping_postal_code TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id),
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    customer_id TEXT NOT NULL REFERENCES profiles(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0)
  )`,
  `CREATE TABLE IF NOT EXISTS custom_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    customer_id TEXT NOT NULL REFERENCES profiles(id),
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    user_id TEXT NOT NULL REFERENCES profiles(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (tenant_id, product_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS wishlist (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    customer_id TEXT NOT NULL REFERENCES profiles(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (tenant_id, customer_id, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS master_tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS master_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    banner_text TEXT NOT NULL DEFAULT ''
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
    ["logo_url", "TEXT"],
    ["hero_title", "TEXT"],
    ["hero_subtitle", "TEXT"],
    ["phone_numbers", "TEXT NOT NULL DEFAULT '[]'"],
    ["address_text", "TEXT"],
    ["location_url", "TEXT"],
    ["social_links", "TEXT NOT NULL DEFAULT '{}'"],
    ["toman_rate", "REAL"],
    ["instagram_url", "TEXT"],
    ["telegram_url", "TEXT"],
    ["whatsapp_url", "TEXT"],
    ["theme_settings", `TEXT NOT NULL DEFAULT '{"primary":"#d4af37","background":"#0a0a0a","text":"#ffffff","accent":"#e2c16d","card":"#151514","bgImageUrl":null,"bgOpacity":45}'`],
    ["status", "TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended'))"],
    ["expiry_date", "TEXT"],
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
    ["specifications", "TEXT NOT NULL DEFAULT '{}'"],
  ]) {
    await ensureColumn("products", column, definition);
  }

  await ensureColumn("categories", "parent_id", "TEXT REFERENCES categories(id)");

  for (const [column, definition] of [
    ["first_name", "TEXT"],
    ["last_name", "TEXT"],
    ["national_id", "TEXT"],
    ["mobile", "TEXT"],
    ["email", "TEXT"],
    ["address", "TEXT"],
  ]) {
    await ensureColumn("profiles", column, definition);
  }

  for (const [column, definition] of [
    ["customer_name", "TEXT"],
    ["customer_phone", "TEXT"],
    ["customer_address", "TEXT"],
    ["shipping_city", "TEXT"],
    ["shipping_postal_code", "TEXT"],
  ]) {
    await ensureColumn("orders", column, definition);
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
       AND name IN ('tenants', 'profiles', 'categories', 'products',
                    'cart_items', 'orders', 'order_items', 'custom_orders',
                    'reviews', 'wishlist', 'platform_settings', 'master_tools',
                    'master_settings')`,
  );
  const createdTables = new Set(result.rows.map((row) => row.name));
  const expectedTables = [
    "tenants",
    "profiles",
    "categories",
    "products",
    "cart_items",
    "orders",
    "order_items",
    "custom_orders",
    "reviews",
    "wishlist",
    "platform_settings",
    "master_tools",
    "master_settings",
  ];
  const missingTables = expectedTables.filter(
    (table) => !createdTables.has(table),
  );

  if (missingTables.length > 0) {
    throw new Error(`Table verification failed: ${missingTables.join(", ")}`);
  }

  await client.execute({
    sql: "UPDATE tenants SET name = ? WHERE id = ?",
    args: ["گالری طلای امیر", "team-gold-system"],
  });

  await client.batch(
    [
      {
        sql: `INSERT OR IGNORE INTO master_tools (id, name, url, icon, "order")
              VALUES (?, ?, ?, ?, ?)`,
        args: ["c772441e-8e88-4a2d-bff0-0d221ec48273", "پنل سرور", "https://server.skteam.ir", "🖥️", 1],
      },
      {
        sql: `INSERT OR IGNORE INTO master_tools (id, name, url, icon, "order")
              VALUES (?, ?, ?, ?, ?)`,
        args: ["f2f827d2-51f2-4c1b-92f6-26e9bc30ad2a", "ربات اینستاگرام", "https://insta-bot.sk-team-it.workers.dev/owner", "📸", 2],
      },
      {
        sql: `INSERT OR IGNORE INTO master_tools (id, name, url, icon, "order")
              VALUES (?, ?, ?, ?, ?)`,
        args: ["b9ac4a89-0083-456d-bdc8-3da3c297dbef", "سایت اصلی", "https://skteam.ir", "🌐", 3],
      },
      `INSERT OR IGNORE INTO master_settings (id, banner_text) VALUES ('global', '')`,
    ],
    "write",
  );

  console.log(`Verified tables: ${expectedTables.join(", ")}`);
} finally {
  await client.close();
}
