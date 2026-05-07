import { NextResponse } from "next/server";
import { createAdminUser, listAdminUsers, type AdminRole } from "@/lib/adminUsers";
import { adminSessionFromRequest } from "@/lib/adminSession";

function requireSuperAdmin(request: Request) {
  const session = adminSessionFromRequest(request);
  return session?.role === "SUPER_ADMIN";
}

export async function GET(request: Request) {
  if (!requireSuperAdmin(request)) {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }
  return NextResponse.json({ users: await listAdminUsers() });
}

export async function POST(request: Request) {
  if (!requireSuperAdmin(request)) {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }
  const input = (await request.json()) as { username: string; password: string; role: AdminRole };
  const result = await createAdminUser(input);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json({ users: result.users });
}
