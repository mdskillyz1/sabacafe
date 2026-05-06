import { NextResponse } from "next/server";
import type { BookingAvailabilityRule } from "@saba/shared";
import { readBookingStore, writeBookingStore } from "@/lib/bookingStore";

export async function GET() {
  const store = await readBookingStore();
  return NextResponse.json({ availability: store.availability });
}

export async function PUT(request: Request) {
  const availability = (await request.json()) as BookingAvailabilityRule[];
  const store = await readBookingStore();
  const saved = await writeBookingStore({ ...store, availability });
  return NextResponse.json({ availability: saved.availability });
}
