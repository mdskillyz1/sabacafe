import { NextResponse } from "next/server";
import { readOperationsSettings, writeOperationsSettings } from "@/lib/operationsSettings";
import { type OperationsSettings } from "@saba/shared";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";

export async function GET() {
  return NextResponse.json(await readOperationsSettings());
}

export async function PUT(request: Request) {
  const input = (await request.json()) as OperationsSettings;
  const saved = await writeOperationsSettings(input);
  await logAdminActivity({
    type: "settings_update",
    message: "Delivery and pickup settings updated",
    session: adminSessionFromRequest(request)
  });
  return NextResponse.json(saved);
}
