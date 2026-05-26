import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { updateOrderNotes } from "@/lib/orderStore";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const order = await updateOrderNotes(id, String(body.notes ?? ""));
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(order);
}
