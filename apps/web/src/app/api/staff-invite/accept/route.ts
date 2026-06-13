import { NextResponse } from "next/server";
import { acceptStaffInvite } from "@/lib/adminUsers";

export async function POST(request: Request) {
  const input = (await request.json().catch(() => ({}))) as { token?: string; password?: string };
  if (!input.token || !input.password) return NextResponse.json({ error: "Invite token and password are required." }, { status: 400 });
  const result = await acceptStaffInvite({ token: input.token, password: input.password });
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json({ ok: true });
}
