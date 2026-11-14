import "server-only";

import { createClient } from "@libsql/client/web";

function requiredEnv(name: string): string {
  const value = process.env[name];
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
function readAuthToken(name: string): string {
  const token = requiredEnv(name).trim().split(/\s+/)[0];
  if (!/^[\x21-\x7e]+$/.test(token)) {
    throw new Error(
      `Environment variable ${name} contains characters that are not allowed in an HTTP header.`,
    );
  }
  return token;
}

type DatabaseClient = ReturnType<typeof createClient>;

let client: DatabaseClient | undefined;

function getClient(): DatabaseClient {
  if (!client) {
    client = createClient({
      url: requiredEnv("TURSO_DATABASE_URL").trim(),
      authToken: readAuthToken("TURSO_AUTH_TOKEN"),
    });
  }
  return client;
}

export const db = new Proxy({} as DatabaseClient, {
  get(_target, property) {
    const database = getClient();
    const value = Reflect.get(database, property, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
