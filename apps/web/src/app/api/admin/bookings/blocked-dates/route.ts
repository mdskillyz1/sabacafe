import { NextResponse } from "next/server";
import type { BlockedDate } from "@saba/shared";
import { readBookingStore, writeBookingStore } from "@/lib/bookingStore";

export async function GET() {
  const store = await readBookingStore();
  return NextResponse.json({ blockedDates: store.blockedDates });
}

export async function PUT(request: Request) {
  const blockedDates = (await request.json()) as BlockedDate[];
  const store = await readBookingStore();
  const saved = await writeBookingStore({ ...store, blockedDates });
  return NextResponse.json({ blockedDates: saved.blockedDates });
}
