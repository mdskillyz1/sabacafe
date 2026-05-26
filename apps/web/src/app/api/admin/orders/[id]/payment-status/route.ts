import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { updateOrderPaymentStatus } from "@/lib/orderStore";
import type { PaymentStatus } from "@saba/shared";

const statuses: PaymentStatus[] = ["PENDING", "PENDING_PAYMENT", "REQUIRES_ACTION", "PAID", "FAILED", "REFUNDED", "PAY_IN_STORE"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const body = await request.json();
  if (!statuses.includes(body.paymentStatus)) return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
  const { id } = await params;
  const order = await updateOrderPaymentStatus(id, body.paymentStatus);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(order);
}
