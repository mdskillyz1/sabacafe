import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";
import { updateOrderNotes } from "@/lib/orderStore";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  if (session.role === "KITCHEN") return NextResponse.json({ error: "Kitchen cannot amend order notes." }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const order = await updateOrderNotes(id, String(body.notes ?? ""));
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  await logAdminActivity({
    type: "order_amended",
    message: `${order.orderNumber} notes amended${order.tableNumber ? ` for ${order.tableNumber}` : ""}`,
    session,
    entityId: id,
    metadata: { tableNumber: order.tableNumber, orderNumber: order.orderNumber }
  });
  return NextResponse.json(order);
}
