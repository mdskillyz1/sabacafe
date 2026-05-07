import { NextResponse } from "next/server";
import { trackWebsiteEvent } from "@/lib/eventStore";

export async function POST(request: Request) {
  const input = (await request.json().catch(() => ({}))) as { type?: string; path?: string; sessionId?: string };
  if (!input.type) return NextResponse.json({ ok: true });
  await trackWebsiteEvent({ type: input.type, path: input.path, sessionId: input.sessionId });
  return NextResponse.json({ ok: true });
}
