import { NextResponse } from "next/server";
import type { BlockedTimeSlot } from "@saba/shared";
import { readBookingStore, writeBookingStore } from "@/lib/bookingStore";

export async function GET() {
  const store = await readBookingStore();
  return NextResponse.json({ blockedTimeSlots: store.blockedTimeSlots });
}

export async function PUT(request: Request) {
  const blockedTimeSlots = (await request.json()) as BlockedTimeSlot[];
  const store = await readBookingStore();
  const saved = await writeBookingStore({ ...store, blockedTimeSlots });
  return NextResponse.json({ blockedTimeSlots: saved.blockedTimeSlots });
}
