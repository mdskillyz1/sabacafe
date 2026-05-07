import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/adminUsers";
import { adminCookieName, createAdminSessionCookie } from "@/lib/adminSession";

type LoginAttempt = { count: number; resetAt: number };

const attempts = new Map<string, LoginAttempt>();
const windowMs = 10 * 60 * 1000;
const maxAttempts = 5;

function rateLimitKey(request: Request, username: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${forwardedFor || "local"}:${username.trim().toLowerCase()}`;
}

function checkRateLimit(key: string) {
  const current = attempts.get(key);
  const now = Date.now();
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 0, resetAt: now + windowMs });
    return true;
  }
  return current.count < maxAttempts;
}

function recordFailedAttempt(key: string) {
  const current = attempts.get(key) ?? { count: 0, resetAt: Date.now() + windowMs };
  attempts.set(key, { ...current, count: current.count + 1 });
}

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const key = rateLimitKey(request, username);
  if (!checkRateLimit(key)) {
    return NextResponse.json({ error: "Too many login attempts. Try again in 10 minutes." }, { status: 429 });
  }

  const admin = await authenticateAdmin(username, password);
  if (!admin) {
    recordFailedAttempt(key);
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, createAdminSessionCookie(admin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
