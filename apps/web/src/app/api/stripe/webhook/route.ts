import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { markDemoPayment } from "@/lib/data";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ received: true, mode: "webhook-not-configured" });
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) await markDemoPayment(orderId, "PAID");
  }
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) await markDemoPayment(orderId, "FAILED");
  }
  return NextResponse.json({ received: true });
}
