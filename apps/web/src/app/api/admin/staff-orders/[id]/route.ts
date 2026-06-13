import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";
import { getOrder, updateOrderItems } from "@/lib/orderStore";
import type { CartLine } from "@saba/shared";

const allowedRoles = new Set(["SUPER_ADMIN", "MANAGER", "STAFF"]);

function itemTotal(items: CartLine[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session || !allowedRoles.has(session.role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  const { id } = await params;
  const before = await getOrder(id);
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (before.orderType !== "DINE_IN") return NextResponse.json({ error: "Only dine-in table orders can be amended here." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { items?: CartLine[] };
  if (!body.items?.length) return NextResponse.json({ error: "Add at least one item before saving." }, { status: 400 });

  try {
    const order = await updateOrderItems(id, body.items);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const beforeCount = itemTotal(before.items);
    const afterCount = itemTotal(order.items);
    const activityType = afterCount < beforeCount ? "order_item_removed" : afterCount > beforeCount ? "order_item_added" : "order_amended";
    await logAdminActivity({
      type: activityType,
      message: `${session.username} amended ${order.orderNumber}${order.tableNumber ? ` for ${order.tableNumber}` : ""}`,
      session,
      entityId: order.id,
      metadata: {
        tableNumber: order.tableNumber,
        orderNumber: order.orderNumber,
        beforeItemCount: beforeCount,
        afterItemCount: afterCount
      }
    });
    await logAdminActivity({
      type: "order_amended",
      message: `${order.orderNumber} saved with ${afterCount} item${afterCount === 1 ? "" : "s"}`,
      session,
      entityId: order.id,
      metadata: { tableNumber: order.tableNumber, orderNumber: order.orderNumber }
    });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order could not be amended." }, { status: 400 });
  }
}
