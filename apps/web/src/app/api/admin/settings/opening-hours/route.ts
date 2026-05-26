import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { openingHours } from "@saba/shared";

export async function GET() {
  return NextResponse.json({ openingHours });
}

export async function PATCH(request: Request) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  return NextResponse.json({ openingHours, message: "Opening hours API is ready for database-backed editing." });
}
