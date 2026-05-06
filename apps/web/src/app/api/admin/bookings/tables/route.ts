import { NextResponse } from "next/server";
import { readBookingStore, writeBookingStore } from "@/lib/bookingStore";

export async function GET() {
  const store = await readBookingStore();
  return NextResponse.json({ tables: store.tables });
}

export async function POST(request: Request) {
  const input = await request.json();
  const store = await readBookingStore();
  const table = {
    id: crypto.randomUUID(),
    name: String(input.name ?? "New table"),
    capacity: Math.max(1, Number(input.capacity ?? 2)),
    active: input.active ?? true
  };
  await writeBookingStore({ ...store, tables: [...store.tables, table] });
  return NextResponse.json({ table });
}

export async function PUT(request: Request) {
  const input = await request.json();
  const store = await readBookingStore();
  const tables = store.tables.map((table) => (table.id === input.id ? { ...table, ...input, capacity: Math.max(1, Number(input.capacity ?? table.capacity)) } : table));
  await writeBookingStore({ ...store, tables });
  return NextResponse.json({ tables });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const store = await readBookingStore();
  const tables = store.tables.filter((table) => table.id !== id);
  await writeBookingStore({ ...store, tables });
  return NextResponse.json({ tables });
}
