import { NextResponse } from "next/server";
import { readOperationsSettings, writeOperationsSettings } from "@/lib/operationsSettings";
import { type OperationsSettings } from "@saba/shared";

export async function GET() {
  return NextResponse.json(await readOperationsSettings());
}

export async function PUT(request: Request) {
  const input = (await request.json()) as OperationsSettings;
  return NextResponse.json(await writeOperationsSettings(input));
}
