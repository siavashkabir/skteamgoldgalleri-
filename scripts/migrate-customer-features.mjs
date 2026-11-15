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

try {
  await client.batch(
    [
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
    ],
    "write",
  );

  const result = await client.execute(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name IN ('reviews', 'wishlist')`,
  );
  const tables = new Set(result.rows.map((row) => row.name));
  const missing = ["reviews", "wishlist"].filter((table) => !tables.has(table));
  if (missing.length) {
    throw new Error(`Feature table verification failed: ${missing.join(", ")}`);
  }
  console.log("Verified feature tables: reviews, wishlist");
} finally {
  await client.close();
}
