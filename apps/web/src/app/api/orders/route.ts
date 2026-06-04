import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/lib/orderStore";
import { quoteDelivery } from "@/lib/delivery";
import { getPublishedMenu } from "@/lib/menuStore";
import { readOperationsSettings } from "@/lib/operationsSettings";
import { readBookingStore } from "@/lib/bookingStore";
import { calculatePrice, validatePostcode, type CheckoutInput } from "@saba/shared";

function normaliseTable(value?: string | null) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function isActiveTable(tableNumber?: string) {
  const requested = normaliseTable(tableNumber);
  if (!requested) return false;
  const store = await readBookingStore();
  return store.tables.some((table) => {
    if (!table.active) return false;
    const name = normaliseTable(table.name);
    const shortName = name.replace(/^table\s+/, "");
    return requested === name || requested === shortName;
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json({
    orders: await getOrders({
      orderType: url.searchParams.get("orderType") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      paymentStatus: url.searchParams.get("paymentStatus") ?? undefined
    })
  });
}

export async function POST(request: Request) {
  const input = (await request.json()) as CheckoutInput;
  const orderType = input.orderType ?? (input.fulfilmentType === "DELIVERY" ? "DELIVERY" : "COLLECTION");
  if (!input.items?.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  if (!input.customerName || (orderType !== "DINE_IN" && !input.phone)) {
    return NextResponse.json({ error: "Required customer details are missing." }, { status: 400 });
  }
  const settings = await readOperationsSettings();
  if (orderType === "DINE_IN" && settings.dineInEnabled === false) {
    return NextResponse.json({ error: "Dine-in QR ordering is currently switched off." }, { status: 400 });
  }
  if (orderType === "DINE_IN" && !(await isActiveTable(input.tableNumber))) {
    return NextResponse.json({ error: "Please scan an active table QR code inside Saba Cafe before ordering." }, { status: 400 });
  }
  if (orderType === "COLLECTION" && !settings.pickupEnabled) {
    return NextResponse.json({ error: "Collection is currently switched off." }, { status: 400 });
  }
  if (orderType === "DELIVERY" && !settings.deliveryEnabled) {
    return NextResponse.json({ error: "Delivery is currently switched off." }, { status: 400 });
  }
  if (orderType === "DELIVERY" && !validatePostcode(input.postcode)) {
    return NextResponse.json({ error: "Delivery postcode is outside the configured radius." }, { status: 400 });
  }
  const deliveryQuote =
    orderType === "DELIVERY" ? await quoteDelivery(input.postcode ?? "", settings) : { allowed: true, deliveryFeePence: 0 };
  if (!deliveryQuote.allowed) {
    return NextResponse.json({ error: deliveryQuote.reason ?? "This address is outside our delivery radius." }, { status: 400 });
  }
  const menu = await getPublishedMenu();
  const totals = calculatePrice(
    input.items,
    menu.items,
    orderType === "DELIVERY" ? "DELIVERY" : "PICKUP",
    input.promoCode,
    0.2,
    settings.minimumOrderPence ?? 1200,
    deliveryQuote.deliveryFeePence ?? 0
  );
  if (orderType !== "DINE_IN" && !totals.minimumMet) return NextResponse.json({ error: "Minimum order value has not been met." }, { status: 400 });
  try {
    const order = await createOrder({ ...input, orderType, fulfilmentType: orderType === "DELIVERY" ? "DELIVERY" : "PICKUP" });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order could not be created." }, { status: 400 });
  }
}
