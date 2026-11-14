import "server-only";

import { createClient } from "@libsql/client";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const db = createClient({
  url: requiredEnv("TURSO_DATABASE_URL"),
  authToken: requiredEnv("TURSO_AUTH_TOKEN"),
});
