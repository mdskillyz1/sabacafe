import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orderStore";

export async function GET(_request: Request, { params }: { params: Promise<{ trackingCode: string }> }) {
  const { trackingCode } = await params;
  const order = await getOrder(trackingCode);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(order);
}
