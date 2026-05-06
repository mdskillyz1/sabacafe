import { NextResponse } from "next/server";
import { getDemoOrder, markDemoPayment } from "@/lib/data";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const { orderId } = await request.json();
  const order = await getDemoOrder(orderId);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const stripe = getStripe();
  if (!stripe) {
    await markDemoPayment(orderId, "PAID");
    return NextResponse.json({
      mode: "demo-paid",
      paymentStatus: "PAID",
      message: "STRIPE_SECRET_KEY is not configured, so this starter marks the demo order as paid."
    });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.totals.totalPence,
    currency: "gbp",
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber
    }
  });
  return NextResponse.json({
    mode: "stripe-payment-intent",
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    paymentStatus: paymentIntent.status
  });
}
