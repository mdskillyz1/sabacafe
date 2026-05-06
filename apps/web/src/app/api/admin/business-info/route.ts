import { NextResponse } from "next/server";
import { readBusinessInfo, writeBusinessInfo } from "@/lib/businessInfoStore";
import { type BusinessInfoSettings } from "@saba/shared";

export async function GET() {
  return NextResponse.json(await readBusinessInfo());
}

export async function PUT(request: Request) {
  const result = await writeBusinessInfo((await request.json()) as BusinessInfoSettings);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors, data: result.data }, { status: 400 });
  }
  return NextResponse.json(result.data);
}
