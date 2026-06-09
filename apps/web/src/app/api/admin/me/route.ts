import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";

export async function GET(request: Request) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });

  return NextResponse.json({
    user: {
      id: session.id,
      username: session.username,
      role: session.role,
      label: session.role === "SUPER_ADMIN" ? "Owner" : "Shop"
    }
  });
}
