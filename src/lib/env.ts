import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getEnv(key: string): string {
  try {
    const { env } = getCloudflareContext();
    const value: unknown = Reflect.get(env, key);
    if (typeof value === "string" && value) {
      return value;
    }
  } catch {
    return process.env[key] || "";
  }

  return process.env[key] || "";
}
