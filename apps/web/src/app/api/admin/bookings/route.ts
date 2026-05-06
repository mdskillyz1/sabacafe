import { NextResponse } from "next/server";
import { readBookingStore } from "@/lib/bookingStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const store = await readBookingStore();
  const bookings = store.bookings
    .filter((booking) => (date ? booking.date === date : true))
    .filter((booking) => (status && status !== "ALL" ? booking.status === status : true))
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  return NextResponse.json({ bookings, tables: store.tables });
}
