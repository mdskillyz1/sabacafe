import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";
import { createOrder } from "@/lib/orderStore";
import { readBookingStore } from "@/lib/bookingStore";
import type { CartLine } from "@saba/shared";

const allowedRoles = new Set(["SUPER_ADMIN", "MANAGER", "STAFF"]);

function cleanTable(value?: string) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  const session = adminSessionFromRequest(request);
  if (!session || !allowedRoles.has(session.role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as {
    tableId?: string;
    tableNumber?: string;
    customerName?: string;
    notes?: string;
    items?: CartLine[];
  };
  const tableNumber = cleanTable(body.tableNumber);
  if (!tableNumber) return NextResponse.json({ error: "Choose a table before sending to kitchen." }, { status: 400 });
  if (!body.items?.length) return NextResponse.json({ error: "Add at least one item." }, { status: 400 });

  const store = await readBookingStore();
  const table = store.tables.find((candidate) => candidate.active && (candidate.id === body.tableId || candidate.name === tableNumber));
  if (!table) return NextResponse.json({ error: "Table is not active." }, { status: 400 });

  try {
    const order = await createOrder({
      orderType: "DINE_IN",
      fulfilmentType: "PICKUP",
      paymentMethod: "PAY_IN_STORE",
      tableId: table.id,
      tableNumber: table.name,
      customerName: body.customerName?.trim() || session.username,
      email: "",
      phone: "",
      deliveryNotes: body.notes ?? "",
      items: body.items,
      promoCode: ""
    });
    await logAdminActivity({
      type: "order_created",
      message: `${session.username} created ${order.orderNumber} for ${table.name}`,
      session,
      entityId: order.id,
      metadata: { tableNumber: table.name, orderNumber: order.orderNumber, itemCount: body.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
    await logAdminActivity({
      type: "order_item_added",
      message: `${session.username} added ${body.items.reduce((sum, item) => sum + item.quantity, 0)} items to ${order.orderNumber}`,
      session,
      entityId: order.id,
      metadata: { tableNumber: table.name, orderNumber: order.orderNumber }
    });
    await logAdminActivity({
      type: "order_sent_to_kitchen",
      message: `${session.username} sent ${order.orderNumber} to kitchen for ${table.name}`,
      session,
      entityId: order.id,
      metadata: { tableNumber: table.name, orderNumber: order.orderNumber }
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order could not be created." }, { status: 400 });
  }
}
