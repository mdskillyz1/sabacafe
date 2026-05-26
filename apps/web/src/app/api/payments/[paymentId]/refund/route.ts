import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { updateOrderPaymentStatus } from "@/lib/orderStore";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const { paymentId } = await params;
  const body = await request.json().catch(() => ({}));
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  const refundInput = typeof body.amountPence === "number" ? { payment_intent: paymentId, amount: body.amountPence } : { payment_intent: paymentId };
  const refund = await stripe.refunds.create(refundInput);
  if (body.orderId) await updateOrderPaymentStatus(body.orderId, "REFUNDED", paymentId);
  return NextResponse.json(refund);
}
