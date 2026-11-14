import "server-only";

import { db } from "@/lib/db";

export async function getPlatformBranding(): Promise<{
  name: string;
  url: string;
}> {
  const result = await db.execute(
    "SELECT key, value FROM platform_settings WHERE key IN ('platform_name', 'platform_url')",
  );
  const values = new Map(
    result.rows.map((row) => [String(row.key), String(row.value)]),
  );
  return {
    name: values.get("platform_name") || "SK Team",
    url: values.get("platform_url") || "",
  };
}
