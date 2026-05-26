import { NextResponse } from "next/server";
import { getMenu } from "@/lib/data";

export async function GET() {
  const menu = await getMenu();
  return NextResponse.json({ categories: menu.categories });
}
