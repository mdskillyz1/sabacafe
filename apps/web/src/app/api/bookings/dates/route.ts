import { NextResponse } from "next/server";
import { getAvailableDates } from "@/lib/bookingStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(7, Number(searchParams.get("days") ?? 45)));
  const partySize = Math.min(20, Math.max(1, Number(searchParams.get("partySize") ?? 2)));
  return NextResponse.json({ dates: await getAvailableDates(days, partySize) });
}
