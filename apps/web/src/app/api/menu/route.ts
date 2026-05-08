import { NextResponse } from "next/server";
import { getMenu } from "@/lib/data";
import { menuCategories } from "@saba/shared";

export async function GET() {
  try {
    return NextResponse.json(await getMenu());
  } catch (error) {
    console.error("Public menu load failed", error);
    return NextResponse.json({ categories: menuCategories, items: [], published: false, error: "Menu is temporarily unavailable." }, { status: 503 });
  }
}
