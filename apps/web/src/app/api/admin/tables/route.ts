import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { readBookingStore, writeBookingStore } from "@/lib/bookingStore";
import { tableQrToken } from "@/lib/tableQr";

function signedQrUrl(request: Request, table: { id: string; name: string }) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return `${origin}/order?type=dine-in&tableId=${encodeURIComponent(table.id)}&table=${encodeURIComponent(table.name)}&token=${encodeURIComponent(tableQrToken(table))}`;
}

export async function GET(request: Request) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const store = await readBookingStore();
  return NextResponse.json({
    tables: store.tables.map((table) => ({ ...table, qrCodeUrl: signedQrUrl(request, table) }))
  });
}

export async function POST(request: Request) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const body = await request.json();
  const store = await readBookingStore();
  const table = {
    id: `table-${crypto.randomUUID()}`,
    name: String(body.name ?? `Table ${store.tables.length + 1}`),
    capacity: Math.max(1, Number(body.capacity) || 2),
    active: body.active !== false
  };
  const next = await writeBookingStore({ ...store, tables: [...store.tables, table] });
  return NextResponse.json({ table: { ...table, qrCodeUrl: signedQrUrl(request, table) }, tables: next.tables }, { status: 201 });
}
