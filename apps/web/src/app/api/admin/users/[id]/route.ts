import { NextResponse } from "next/server";
import { deleteAdminUser, updateAdminUser, type AdminRole } from "@/lib/adminUsers";
import { adminSessionFromRequest } from "@/lib/adminSession";

function requireSuperAdmin(request: Request) {
  const session = adminSessionFromRequest(request);
  return session?.role === "SUPER_ADMIN";
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireSuperAdmin(request)) {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }
  const { id } = await params;
  const input = (await request.json()) as { username?: string; password?: string; role?: AdminRole; isActive?: boolean };
  const result = await updateAdminUser(id, input);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json({ users: result.users });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireSuperAdmin(request)) {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }
  const { id } = await params;
  const result = await deleteAdminUser(id);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json({ users: result.users });
}
