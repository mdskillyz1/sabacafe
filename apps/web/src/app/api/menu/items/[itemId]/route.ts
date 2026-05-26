import { NextResponse } from "next/server";
import { getMenu } from "@/lib/data";

export async function GET(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const menu = await getMenu();
  const item = menu.items.find((candidate) => candidate.id === itemId || candidate.slug === itemId);
  if (!item) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  return NextResponse.json(item);
}
