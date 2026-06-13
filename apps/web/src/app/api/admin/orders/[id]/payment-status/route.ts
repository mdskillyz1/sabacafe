import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";
import { updateOrderPaymentStatus } from "@/lib/orderStore";
import type { PaymentStatus } from "@saba/shared";

const statuses: PaymentStatus[] = ["PENDING", "PENDING_PAYMENT", "REQUIRES_ACTION", "PAID", "FAILED", "REFUNDED", "PAY_IN_STORE"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  if (session.role === "KITCHEN") return NextResponse.json({ error: "Kitchen cannot update payment status." }, { status: 403 });
  const body = await request.json();
  if (!statuses.includes(body.paymentStatus)) return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
  const { id } = await params;
  const order = await updateOrderPaymentStatus(id, body.paymentStatus);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (body.paymentStatus === "PAID") {
    await logAdminActivity({
      type: "order_marked_paid",
      message: `${order.orderNumber} marked paid${order.tableNumber ? ` for ${order.tableNumber}` : ""}`,
      session,
      entityId: id,
      metadata: { tableNumber: order.tableNumber, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus }
    });
  }
  return NextResponse.json(order);
}
