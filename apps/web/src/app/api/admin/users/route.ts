import { NextResponse } from "next/server";
import { createAdminUser, createStaffInvite, listAdminUsers, type AdminRole } from "@/lib/adminUsers";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";

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
  const session = adminSessionFromRequest(request);
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  }
  const input = (await request.json()) as { username?: string; password?: string; role: AdminRole; fullName?: string; email?: string; invite?: boolean };
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const result = input.invite
    ? await createStaffInvite({ fullName: input.fullName ?? "", email: input.email ?? "", role: input.role, origin })
    : await createAdminUser({ username: input.username ?? "", password: input.password, role: input.role, fullName: input.fullName, email: input.email });
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  await logAdminActivity({
    type: input.invite ? "staff_invited" : "staff_updated",
    message: input.invite ? `Invited ${input.email} as ${input.role}` : `Created ${input.username} as ${input.role}`,
    session
  });
  return NextResponse.json({ users: result.users, inviteUrl: "inviteUrl" in result ? result.inviteUrl : undefined });
}
