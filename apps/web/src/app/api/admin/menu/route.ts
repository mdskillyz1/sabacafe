import { NextResponse } from "next/server";
import { readMenuStore, writeMenuStore, type MenuStore } from "@/lib/menuStore";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";

export async function GET() {
  return NextResponse.json(await readMenuStore());
}

export async function PUT(request: Request) {
  const input = (await request.json()) as MenuStore;
  const saved = await writeMenuStore(input);
  await logAdminActivity({
    type: "menu_update",
    message: `Menu ${saved.published ? "published" : "draft saved"} with ${saved.items.length} item${saved.items.length === 1 ? "" : "s"}`,
    session: adminSessionFromRequest(request)
  });
  return NextResponse.json(saved);
}
