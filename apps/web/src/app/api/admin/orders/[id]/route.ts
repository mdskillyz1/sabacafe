import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { deleteOrder, getOrder } from "@/lib/orderStore";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(order);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const { id } = await params;
  await deleteOrder(id);
  return NextResponse.json({ ok: true });
}
