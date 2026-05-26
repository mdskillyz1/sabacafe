import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { trackWebsiteEvent } from "@/lib/eventStore";
import { updateOrderPaymentStatus } from "@/lib/orderStore";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ received: true, mode: "webhook-not-configured" });
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await updateOrderPaymentStatus(orderId, "PAID", session.payment_intent?.toString() ?? session.id);
      await trackWebsiteEvent({ type: "order_complete", path: "/order" });
    }
  }
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) await updateOrderPaymentStatus(orderId, "PAID", paymentIntent.id);
  }
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) await updateOrderPaymentStatus(orderId, "FAILED", paymentIntent.id);
  }
  return NextResponse.json({ received: true });
}
