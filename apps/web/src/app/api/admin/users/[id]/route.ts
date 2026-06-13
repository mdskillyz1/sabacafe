import { NextResponse } from "next/server";
import { deleteAdminUser, updateAdminUser, type AdminRole } from "@/lib/adminUsers";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }
  const { id } = await params;
  const input = (await request.json()) as { username?: string; password?: string; role?: AdminRole; isActive?: boolean; fullName?: string; email?: string };
  const result = await updateAdminUser(id, input);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  await logAdminActivity({
    type: input.isActive === false ? "staff_disabled" : "staff_updated",
    message: `Updated staff account ${id}`,
    session,
    entityId: id
  });
  return NextResponse.json({ users: result.users });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }
  const { id } = await params;
  const result = await deleteAdminUser(id);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  await logAdminActivity({ type: "staff_disabled", message: `Deleted staff account ${id}`, session, entityId: id });
  return NextResponse.json({ users: result.users });
}
