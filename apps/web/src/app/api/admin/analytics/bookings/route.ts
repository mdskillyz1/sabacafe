import { NextResponse } from "next/server";
import { getAnalytics, resolveAnalyticsRange } from "@/lib/adminAnalytics";

export async function GET(request: Request) {
  const analytics = await getAnalytics(resolveAnalyticsRange(new URL(request.url).searchParams));
  return NextResponse.json({ range: analytics.range, bookings: analytics.bookings });
}
