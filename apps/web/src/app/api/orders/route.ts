import { NextResponse } from "next/server";
import { createDemoOrder, getDemoOrders } from "@/lib/data";
import { quoteDelivery } from "@/lib/delivery";
import { getPublishedMenu } from "@/lib/menuStore";
import { readOperationsSettings } from "@/lib/operationsSettings";
import { calculatePrice, validatePostcode, type CheckoutInput } from "@saba/shared";

export async function GET() {
  return NextResponse.json({ orders: await getDemoOrders() });
}

export async function POST(request: Request) {
  const input = (await request.json()) as CheckoutInput;
  if (!input.items?.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  if (!input.customerName || !input.email || !input.phone) {
    return NextResponse.json({ error: "Customer details are required." }, { status: 400 });
  }
  const settings = await readOperationsSettings();
  if (input.fulfilmentType === "PICKUP" && !settings.pickupEnabled) {
    return NextResponse.json({ error: "Pickup is currently switched off." }, { status: 400 });
  }
  if (input.fulfilmentType === "DELIVERY" && !settings.deliveryEnabled) {
    return NextResponse.json({ error: "Delivery is currently switched off." }, { status: 400 });
  }
  if (input.fulfilmentType === "DELIVERY" && !validatePostcode(input.postcode)) {
    return NextResponse.json({ error: "Delivery postcode is outside the configured radius." }, { status: 400 });
  }
  const deliveryQuote =
    input.fulfilmentType === "DELIVERY" ? await quoteDelivery(input.postcode ?? "", settings) : { allowed: true, deliveryFeePence: 0 };
  if (!deliveryQuote.allowed) {
    return NextResponse.json({ error: deliveryQuote.reason ?? "This address is outside our delivery radius." }, { status: 400 });
  }
  const menu = await getPublishedMenu();
  const totals = calculatePrice(input.items, menu.items, input.fulfilmentType, input.promoCode, 0.2, 1200, deliveryQuote.deliveryFeePence ?? 0);
  if (!totals.minimumMet) return NextResponse.json({ error: "Minimum order value has not been met." }, { status: 400 });
  const order = await createDemoOrder(input);
  return NextResponse.json(order, { status: 201 });
}
