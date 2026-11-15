import "server-only";

import { createClient } from "@libsql/client/web";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * The auth token is sent in an HTTP `Authorization` header, which only accepts
 * ASCII characters. JWTs never contain whitespace, so anything after the first
 * whitespace (e.g. an accidentally pasted label or note) is discarded.
 */
function readAuthToken(name: string, value: string | undefined): string {
  const token = requiredEnv(name, value).trim().split(/\s+/)[0];
  if (!/^[\x21-\x7e]+$/.test(token)) {
    throw new Error(
      `Environment variable ${name} contains characters that are not allowed in an HTTP header.`,
    );
  }
  return token;
}

type DatabaseClient = ReturnType<typeof createClient>;

let client: DatabaseClient | undefined;

export function getDbClient(): DatabaseClient {
  if (!client) {
    const { env } = getCloudflareContext();
    client = createClient({
      url: requiredEnv("TURSO_DATABASE_URL", env.TURSO_DATABASE_URL).trim(),
      authToken: readAuthToken("TURSO_AUTH_TOKEN", env.TURSO_AUTH_TOKEN),
    });
  }
  return client;
}

export const db = new Proxy({} as DatabaseClient, {
  get(_target, property) {
    const database = getDbClient();
    const value = Reflect.get(database, property, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
