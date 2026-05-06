import { NextResponse } from "next/server";
import { quoteDelivery } from "@/lib/delivery";
import { readOperationsSettings } from "@/lib/operationsSettings";

export async function POST(request: Request) {
  const { postcode } = await request.json();
  const settings = await readOperationsSettings();
  const quote = await quoteDelivery(postcode, settings);
  return NextResponse.json(quote, { status: quote.allowed ? 200 : 400 });
}
