import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { readBookingStore, writeBookingStore } from "@/lib/bookingStore";

export async function PATCH(request: Request, { params }: { params: Promise<{ tableId: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const { tableId } = await params;
  const body = await request.json();
  const store = await readBookingStore();
  const tables = store.tables.map((table) =>
    table.id === tableId
      ? {
          ...table,
          name: body.name ?? table.name,
          capacity: body.capacity === undefined ? table.capacity : Math.max(1, Number(body.capacity) || table.capacity),
          active: body.active === undefined ? table.active : Boolean(body.active)
        }
      : table
  );
  await writeBookingStore({ ...store, tables });
  return NextResponse.json({ table: tables.find((table) => table.id === tableId) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tableId: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const { tableId } = await params;
  const store = await readBookingStore();
  await writeBookingStore({ ...store, tables: store.tables.filter((table) => table.id !== tableId) });
  return NextResponse.json({ ok: true });
}
