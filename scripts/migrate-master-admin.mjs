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
  if (!tenants.rows.length) {
    throw new Error("The tenants table does not exist. Run db:init first.");
  }

  await ensureColumn("tenants", "theme_settings", `TEXT NOT NULL DEFAULT '{"primary":"#d4af37","background":"#0a0a0a","text":"#ffffff","accent":"#e2c16d","card":"#151514","bgImageUrl":null,"bgOpacity":45}'`);
  await ensureColumn(
    "tenants",
    "status",
    "TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended'))",
  );
  await ensureColumn("tenants", "expiry_date", "TEXT");
  await client.batch(
    [
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

  await client.execute({
    sql: `UPDATE tenants SET theme_settings = ?
          WHERE theme_settings IS NULL OR trim(theme_settings) = ''`,
    args: [
      '{"primary":"#d4af37","background":"#0a0a0a","text":"#ffffff","accent":"#e2c16d","card":"#151514","bgImageUrl":null,"bgOpacity":45}',
    ],
  });
  const [verifiedTenants, verifiedTables, seededTools] = await Promise.all([
    client.execute("PRAGMA table_info(tenants)"),
    client.execute(
      `SELECT name FROM sqlite_master WHERE type = 'table'
       AND name IN ('master_tools', 'master_settings')`,
    ),
    client.execute(
      `SELECT name, url, icon FROM master_tools
       WHERE url IN (?, ?, ?)`,
      [
        "https://server.skteam.ir",
        "https://insta-bot.sk-team-it.workers.dev/owner",
        "https://skteam.ir",
      ],
    ),
  ]);
  const tenantColumns = new Set(verifiedTenants.rows.map((row) => row.name));
  const masterTables = new Set(verifiedTables.rows.map((row) => row.name));
  if (
    !tenantColumns.has("theme_settings") ||
    !tenantColumns.has("status") ||
    !tenantColumns.has("expiry_date") ||
    !masterTables.has("master_tools") ||
    !masterTables.has("master_settings") ||
    seededTools.rows.length !== 3 ||
    !seededTools.rows.some((row) => row.name === "پنل سرور" && row.icon === "🖥️") ||
    !seededTools.rows.some((row) => row.name === "ربات اینستاگرام" && row.icon === "📸") ||
    !seededTools.rows.some((row) => row.name === "سایت اصلی" && row.icon === "🌐")
  ) {
    throw new Error("Master-admin database migration verification failed.");
  }
  console.log("Verified master-admin schema and seeded three default tools.");
} finally {
  await client.close();
}
