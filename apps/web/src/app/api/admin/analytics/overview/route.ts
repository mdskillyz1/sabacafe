import { NextResponse } from "next/server";
import { getAnalytics, resolveAnalyticsRange } from "@/lib/adminAnalytics";

export async function GET(request: Request) {
  const range = resolveAnalyticsRange(new URL(request.url).searchParams);
  return NextResponse.json(await getAnalytics(range));
}
