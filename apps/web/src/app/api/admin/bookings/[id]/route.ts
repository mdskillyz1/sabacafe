import { NextResponse } from "next/server";
import type { BookingStatus } from "@saba/shared";
import { updateBookingStatus } from "@/lib/bookingStore";

const statuses = new Set<BookingStatus>(["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "SEATED", "COMPLETED"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const input = await request.json();
  const status = String(input.status ?? "") as BookingStatus;
  if (!statuses.has(status)) {
    return NextResponse.json({ message: "Invalid booking status." }, { status: 400 });
  }
  const booking = await updateBookingStatus(id, status, input.adminNotes ? String(input.adminNotes) : undefined);
  if (!booking) {
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }
  return NextResponse.json({ booking });
}
