import { NextResponse } from "next/server";
import { readOperationsSettings } from "@/lib/operationsSettings";

export async function GET() {
  return NextResponse.json(await readOperationsSettings());
}
