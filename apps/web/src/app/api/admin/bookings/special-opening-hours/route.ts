import { NextResponse } from "next/server";
import type { SpecialOpeningHours } from "@saba/shared";
import { readBookingStore, writeBookingStore } from "@/lib/bookingStore";

export async function GET() {
  const store = await readBookingStore();
  return NextResponse.json({ specialOpeningHours: store.specialOpeningHours });
}

export async function PUT(request: Request) {
  const specialOpeningHours = (await request.json()) as SpecialOpeningHours[];
  const store = await readBookingStore();
  const saved = await writeBookingStore({ ...store, specialOpeningHours });
  return NextResponse.json({ specialOpeningHours: saved.specialOpeningHours });
}
