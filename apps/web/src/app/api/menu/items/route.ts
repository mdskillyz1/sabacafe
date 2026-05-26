import { NextResponse } from "next/server";
import { getMenu } from "@/lib/data";

export async function GET() {
  const menu = await getMenu();
  return NextResponse.json({ items: menu.items });
}
