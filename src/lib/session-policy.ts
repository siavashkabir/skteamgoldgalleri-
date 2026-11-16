export const SESSION_COOKIE = "sk_session";
export const REMEMBER_DAYS = 30;
export const IDLE_MINUTES_WITHOUT_REMEMBER = 60;

export type SessionState = { remember: boolean; lastActive: number };

export function encodeSession(remember: boolean, nowMs: number): string {
  return `${remember ? "1" : "0"}.${nowMs}`;
}

export function parseSession(value: string | null | undefined): SessionState | null {
  if (!value) return null;
  const [flag, timestamp, extra] = value.split(".");
  if (extra !== undefined || (flag !== "0" && flag !== "1")) return null;
  const lastActive = Number(timestamp);
  if (!Number.isFinite(lastActive) || lastActive <= 0) return null;
  return { remember: flag === "1", lastActive };
}

export function isSessionExpired(session: SessionState, nowMs: number): boolean {
  const idleSeconds = session.remember ? REMEMBER_DAYS * 24 * 60 * 60 : IDLE_MINUTES_WITHOUT_REMEMBER * 60;
  return nowMs - session.lastActive > idleSeconds * 1000;
}

export function sessionMaxAge(remember: boolean): number | undefined {
  return remember ? REMEMBER_DAYS * 24 * 60 * 60 : undefined;
}

export function buildSessionCookie(remember: boolean, nowMs: number, secure: boolean): string {
  const parts = [`${SESSION_COOKIE}=${encodeSession(remember, nowMs)}`, "Path=/", "SameSite=Lax"];
  const maxAge = sessionMaxAge(remember);
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
