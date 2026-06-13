import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { updateOrderStatus } from "@/lib/orderStore";
import { logAdminActivity } from "@/lib/eventStore";
import type { OrderStatus } from "@saba/shared";

const statuses: OrderStatus[] = ["RECEIVED", "ACCEPTED", "PREPARING", "READY", "READY_FOR_PICKUP", "SERVED", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const body = await request.json();
  if (!statuses.includes(body.status)) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  if (session.role === "KITCHEN" && !["RECEIVED", "PREPARING", "READY"].includes(body.status)) {
    return NextResponse.json({ error: "Kitchen can only update orders to received, preparing, or ready." }, { status: 403 });
  }
  if (session.role === "STAFF" && !["COMPLETED", "CANCELLED"].includes(body.status)) {
    return NextResponse.json({ error: "Staff can only clear or cancel table orders from the table dashboard." }, { status: 403 });
  }
  const { id } = await params;
  const order = await updateOrderStatus(id, body.status);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const activityType = body.status === "CANCELLED" ? "order_cancelled" : body.status === "COMPLETED" ? "table_cleared" : "order_status_update";
  await logAdminActivity({
    type: activityType,
    message: `${order.orderNumber} updated to ${order.status}${order.tableNumber ? ` for ${order.tableNumber}` : ""}`,
    session,
    entityId: id,
    metadata: { tableNumber: order.tableNumber, orderNumber: order.orderNumber, status: order.status }
  });
  return NextResponse.json(order);
}
