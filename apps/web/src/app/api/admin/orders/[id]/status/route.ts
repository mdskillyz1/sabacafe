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
  const { id } = await params;
  const order = await updateOrderStatus(id, body.status);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  await logAdminActivity({ type: "order_status_update", message: `${order.orderNumber} updated to ${order.status}`, session, entityId: id });
  return NextResponse.json(order);
}
