import { NextResponse } from "next/server";
import { readMenuStore, writeMenuStore, type MenuStore } from "@/lib/menuStore";

export async function GET() {
  return NextResponse.json(await readMenuStore());
}

export async function PUT(request: Request) {
  const input = (await request.json()) as MenuStore;
  const saved = await writeMenuStore(input);
  return NextResponse.json(saved);
}
