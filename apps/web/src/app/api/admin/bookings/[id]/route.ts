import { NextResponse } from "next/server";
import type { BookingStatus } from "@saba/shared";
import { updateBookingStatus } from "@/lib/bookingStore";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";

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
  await logAdminActivity({
    type: "booking_status_update",
    message: `Booking for ${booking.customerName} updated to ${booking.status}`,
    session: adminSessionFromRequest(request),
    entityId: booking.id
  });
  return NextResponse.json({ booking });
}
