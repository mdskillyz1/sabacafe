import { NextResponse } from "next/server";
import { readLegalContent, writeLegalContent } from "@/lib/legalContentStore";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";
import type { LegalContentStore } from "@saba/shared";

export async function GET() {
  return NextResponse.json(await readLegalContent());
}

export async function PUT(request: Request) {
  const input = (await request.json()) as LegalContentStore;
  const saved = await writeLegalContent(input);
  await logAdminActivity({
    type: "settings_update",
    message: "Legal website content updated",
    session: adminSessionFromRequest(request)
  });
  return NextResponse.json(saved);
}
