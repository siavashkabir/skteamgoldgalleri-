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

export async function getDbClient(): Promise<DatabaseClient> {
  if (!client) {
    const { env } = await getCloudflareContext({ async: true });
    client = createClient({
      url: requiredEnv("TURSO_DATABASE_URL", env.TURSO_DATABASE_URL).trim(),
      authToken: readAuthToken("TURSO_AUTH_TOKEN", env.TURSO_AUTH_TOKEN),
    });
  }
  return client;
}

export const db = new Proxy({} as DatabaseClient, {
  get(_target, property) {
    return async (...args: unknown[]) => {
      const database = await getDbClient();
      const method = Reflect.get(database, property, database);
      return Reflect.apply(method, database, args);
    };
  },
});
