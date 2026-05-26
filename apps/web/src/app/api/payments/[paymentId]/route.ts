import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  const payment = paymentId.startsWith("pi_")
    ? await stripe.paymentIntents.retrieve(paymentId)
    : await stripe.checkout.sessions.retrieve(paymentId);
  return NextResponse.json(payment);
}
