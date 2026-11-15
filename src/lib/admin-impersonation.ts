import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";

const cookieName = "master_admin_tenant";
const impersonationLifetimeSeconds = 60 * 60;

async function getSigningKey(): Promise<CryptoKey> {
  const { env } = await getCloudflareContext({ async: true });
  const secret = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return buffer;
}

export async function setImpersonatedTenant(tenantId: string): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + impersonationLifetimeSeconds;
  const payload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify({ tenantId, expiresAt })),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(payload),
  );
  const cookieStore = await cookies();
  cookieStore.set(cookieName, `${payload}.${encodeBase64Url(new Uint8Array(signature))}`, {
    httpOnly: true,
    maxAge: impersonationLifetimeSeconds,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readImpersonatedTenantId(): Promise<string | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return null;
  }
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) {
    return null;
  }
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      decodeBase64Url(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) {
      return null;
    }
    const parsed: unknown = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload)),
    );
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("tenantId" in parsed) ||
      !("expiresAt" in parsed) ||
      typeof parsed.tenantId !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return parsed.tenantId;
  } catch {
    return null;
  }
}

export async function clearImpersonatedTenant(): Promise<void> {
  (await cookies()).set(cookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
