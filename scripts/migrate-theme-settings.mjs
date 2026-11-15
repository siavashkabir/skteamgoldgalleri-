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
const defaultTheme =
  '{"primary":"#d4af37","background":"#0a0a0a","text":"#ffffff"}';

try {
  const columns = await client.execute("PRAGMA table_info(tenants)");
  if (columns.rows.length === 0) {
    throw new Error("The tenants table does not exist.");
  }

  if (!columns.rows.some((row) => row.name === "theme_settings")) {
    await client.execute(
      `ALTER TABLE tenants ADD COLUMN theme_settings TEXT NOT NULL DEFAULT '${defaultTheme}'`,
    );
  }

  await client.execute({
    sql: "UPDATE tenants SET theme_settings = ? WHERE theme_settings IS NULL OR trim(theme_settings) = ''",
    args: [defaultTheme],
  });

  const verifiedColumns = await client.execute("PRAGMA table_info(tenants)");
  if (!verifiedColumns.rows.some((row) => row.name === "theme_settings")) {
    throw new Error("Theme settings column verification failed.");
  }

  console.log("Verified tenants.theme_settings.");
} finally {
  await client.close();
}
