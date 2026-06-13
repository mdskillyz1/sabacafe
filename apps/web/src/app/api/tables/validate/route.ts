import { NextResponse } from "next/server";
import { readBookingStore } from "@/lib/bookingStore";
import { isValidTableQrToken } from "@/lib/tableQr";

function normalise(value?: string | null) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tableId = url.searchParams.get("tableId");
  const tableName = url.searchParams.get("table");
  const token = url.searchParams.get("token");
  const store = await readBookingStore();
  const requestedName = normalise(tableName);
  const table = store.tables.find((candidate) => {
    if (!candidate.active) return false;
    if (tableId && candidate.id === tableId) return true;
    const name = normalise(candidate.name);
    return requestedName && (requestedName === name || requestedName === name.replace(/^table\s+/, ""));
  });

  if (!table) {
    return NextResponse.json({ valid: false, error: "This table QR code is not active." }, { status: 404 });
  }

  if (!isValidTableQrToken(table, token)) {
    return NextResponse.json({ valid: false, error: "This table QR code is invalid or has expired." }, { status: 403 });
  }

  return NextResponse.json({
    valid: true,
    table: {
      id: table.id,
      name: table.name,
      capacity: table.capacity
    },
    token
  });
}
