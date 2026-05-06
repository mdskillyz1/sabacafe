import { NextResponse } from "next/server";
import { createBooking } from "@/lib/bookingStore";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input.customerName || !input.phone || !input.date || !input.startTime) {
      return NextResponse.json({ message: "Name, phone, date, and time are required." }, { status: 400 });
    }
    const partySize = Number(input.partySize);
    if (!Number.isFinite(partySize) || partySize < 1) {
      return NextResponse.json({ message: "Party size must be at least 1." }, { status: 400 });
    }
    const booking = await createBooking({
      customerName: String(input.customerName),
      email: input.email ? String(input.email) : undefined,
      phone: String(input.phone),
      partySize,
      date: String(input.date),
      startTime: String(input.startTime),
      notes: input.notes ? String(input.notes) : undefined
    });
    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to create booking." }, { status: 409 });
  }
}
