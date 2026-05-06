import { NextResponse } from "next/server";
import { readBusinessInfo } from "@/lib/businessInfoStore";

export async function GET() {
  return NextResponse.json(await readBusinessInfo());
}
