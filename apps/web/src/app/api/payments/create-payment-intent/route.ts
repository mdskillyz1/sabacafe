import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orderStore";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const { orderId } = await request.json();
  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.paymentMethod !== "STRIPE_ONLINE") return NextResponse.json({ error: "Order is not set for online payment." }, { status: 400 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.totalPence,
    currency: "gbp",
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, orderNumber: order.orderNumber }
  });
  return NextResponse.json({
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    status: paymentIntent.status
  });
}
