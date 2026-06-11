import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orderStore";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const { orderId } = await request.json();
  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.paymentMethod !== "STRIPE_ONLINE") {
    return NextResponse.json({ mode: "offline", paymentStatus: order.paymentStatus });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Online card payments are not configured yet. Please choose pay in store or cash if enabled." }, { status: 503 });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: order.totalPence,
        product_data: { name: `Saba Cafe order ${order.orderNumber}` }
      }
    }],
    success_url: `${origin}/order-confirmation?order=${order.id}&payment=stripe-success`,
    cancel_url: `${origin}/order?payment=cancelled`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber
    }
  });
  return NextResponse.json({
    mode: "stripe-checkout",
    url: session.url,
    sessionId: session.id,
    paymentStatus: order.paymentStatus
  });
}
