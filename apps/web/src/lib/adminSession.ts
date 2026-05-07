import { createHmac, timingSafeEqual } from "node:crypto";
import type { AdminRole, AdminUserRecord } from "./adminUsers";

export const adminCookieName = "saba_admin_session";

export type AdminSession = {
  id: string;
  username: string;
  role: AdminRole;
  exp: number;
};

function sessionSecret() {
  return process.env.ADMIN_SESSION_TOKEN || "dev-admin-session-secret";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionCookie(user: AdminUserRecord) {
  const session: AdminSession = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 8
  };
  const payload = encodeBase64Url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionCookie(cookie?: string): AdminSession | null {
  if (!cookie) return null;
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  try {
    const session = JSON.parse(decodeBase64Url(payload)) as AdminSession;
    if (!session.id || !session.username || !session.role || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function adminSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${adminCookieName}=`))
    ?.split("=")[1];
  return verifyAdminSessionCookie(cookie);
}
