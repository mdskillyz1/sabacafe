import { NextResponse } from "next/server";

const adminCookieName = "saba_admin_session";

function adminPassword() {
  return process.env.ADMIN_SEED_PASSWORD || "change-me";
}

function adminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN || adminPassword();
}

export async function POST(request: Request) {
  const { password } = await request.json();
  if (!password || password !== adminPassword()) {
    return NextResponse.json({ error: "Incorrect staff password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, adminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
