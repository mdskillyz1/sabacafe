import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";

const labels = {
  SUPER_ADMIN: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
  KITCHEN: "Kitchen"
} as const;

export async function GET(request: Request) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });

  return NextResponse.json({
    user: {
      id: session.id,
      username: session.username,
      role: session.role,
      label: labels[session.role] ?? "Staff"
    }
  });
}
