import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/bookingStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const partySize = Math.min(20, Math.max(1, Number(searchParams.get("partySize") ?? 2)));
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ message: "A valid booking date is required." }, { status: 400 });
  }
  return NextResponse.json({ slots: await getAvailableSlots(date, partySize) });
}
