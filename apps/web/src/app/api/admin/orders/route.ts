import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { getOrders } from "@/lib/orderStore";

export async function GET(request: Request) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const url = new URL(request.url);
  const requestedOrderType = url.searchParams.get("orderType") ?? undefined;
  return NextResponse.json({
    orders: await getOrders({
      orderType: session.role === "STAFF" ? "DINE_IN" : requestedOrderType,
      status: url.searchParams.get("status") ?? undefined,
      paymentStatus: url.searchParams.get("paymentStatus") ?? undefined
    })
  });
}
