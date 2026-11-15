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

  await ensureColumn("tenants", "owner_email", "TEXT");
  await ensureColumn("tenants", "template_id", "TEXT NOT NULL DEFAULT 'luxury'");
  await ensureColumn(
    "tenants",
    "status",
    "TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended'))",
  );
  await ensureColumn("tenants", "expiry_date", "TEXT");
  await client.execute(
    `UPDATE tenants
     SET owner_email = (
       SELECT lower(trim(p.email))
       FROM profiles p
       WHERE p.tenant_id = tenants.id
         AND p.role = 'tenant_admin'
         AND p.email IS NOT NULL
         AND trim(p.email) <> ''
       ORDER BY p.rowid
       LIMIT 1
     )
     WHERE owner_email IS NULL OR trim(owner_email) = ''`,
  );
  const duplicateOwners = await client.execute(
    `SELECT COUNT(*) AS count FROM (
       SELECT lower(trim(owner_email))
       FROM tenants
       WHERE owner_email IS NOT NULL AND trim(owner_email) <> ''
       GROUP BY lower(trim(owner_email))
       HAVING COUNT(*) > 1
     )`,
  );
  if (Number(duplicateOwners.rows[0]?.count) > 0) {
    throw new Error(
      "Multiple tenants share an owner email; assign distinct tenant owner emails before migrating.",
    );
  }
  await client.execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS tenants_owner_email_unique
     ON tenants (lower(trim(owner_email)))
     WHERE owner_email IS NOT NULL AND trim(owner_email) <> ''`,
  );

  const [verified, seeded] = await Promise.all([
    client.execute("PRAGMA table_info(tenants)"),
    client.execute(
      `SELECT COUNT(*) AS count FROM tenants
       WHERE template_id IN ('luxury', 'minimal', 'classic')
         AND status IN ('active', 'trial', 'suspended')`,
    ),
  ]);
  const columns = new Set(verified.rows.map((row) => row.name));
  for (const column of ["owner_email", "template_id", "status", "expiry_date"]) {
    if (!columns.has(column)) {
      throw new Error(`Tenant ownership migration verification failed: ${column}`);
    }
  }
  if (Number(seeded.rows[0]?.count) === 0) {
    throw new Error("Tenant template/subscription data verification failed.");
  }
  console.log("Verified tenant ownership, template, and subscription schema.");
} finally {
  await client.close();
}
