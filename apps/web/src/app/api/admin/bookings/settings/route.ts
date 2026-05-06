import { NextResponse } from "next/server";
import type { BookingStore } from "@saba/shared";
import { readBookingStore, writeBookingStore } from "@/lib/bookingStore";

export async function GET() {
  return NextResponse.json(await readBookingStore());
}

export async function PUT(request: Request) {
  const input = (await request.json()) as BookingStore;
  const current = await readBookingStore();
  const saved = await writeBookingStore({
    ...current,
    ...input,
    tables: input.tables ?? current.tables,
    availability: input.availability ?? current.availability,
    blockedDates: input.blockedDates ?? current.blockedDates,
    blockedTimeSlots: input.blockedTimeSlots ?? current.blockedTimeSlots,
    specialOpeningHours: input.specialOpeningHours ?? current.specialOpeningHours,
    bookings: current.bookings
  });
  return NextResponse.json(saved);
}
