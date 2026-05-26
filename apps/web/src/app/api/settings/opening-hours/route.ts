import { NextResponse } from "next/server";
import { openingHours } from "@saba/shared";

export async function GET() {
  return NextResponse.json({ openingHours });
}
