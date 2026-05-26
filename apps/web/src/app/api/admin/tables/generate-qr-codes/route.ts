import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { readBookingStore } from "@/lib/bookingStore";

export async function POST(request: Request) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const store = await readBookingStore();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return NextResponse.json({
    qrCodes: store.tables.map((table) => ({
      tableId: table.id,
      tableName: table.name,
      url: `${origin}/order?type=dine-in&table=${encodeURIComponent(table.name)}`,
      downloadUrl: `/api/admin/tables/${table.id}/qr`
    }))
  });
}
