import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { readBookingStore } from "@/lib/bookingStore";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function qrSvg(url: string, label: string) {
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&amp;data=${encodeURIComponent(url)}`;
  const safeUrl = escapeXml(url);
  const safeLabel = escapeXml(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900">
    <rect width="720" height="900" fill="#fff8ed"/>
    <text x="360" y="80" text-anchor="middle" font-size="42" font-family="Georgia,serif" fill="#422116">Saba Cafe</text>
    <text x="360" y="130" text-anchor="middle" font-size="28" font-family="Arial,sans-serif" fill="#9a4f2d">${safeLabel}</text>
    <rect x="110" y="180" width="500" height="500" rx="24" fill="#ffffff" stroke="#422116" stroke-width="8"/>
    <image href="${qrImage}" x="140" y="210" width="440" height="440"/>
    <foreignObject x="145" y="690" width="430" height="50">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:22px;line-height:1.35;text-align:center;color:#422116;word-break:break-all;">${safeUrl}</div>
    </foreignObject>
    <text x="360" y="790" text-anchor="middle" font-size="30" font-family="Arial,sans-serif" fill="#117c68">Scan. Order. Relax.</text>
    <text x="360" y="835" text-anchor="middle" font-size="22" font-family="Arial,sans-serif" fill="#856f64">Pay online or pay in store</text>
  </svg>`;
}

export async function GET(request: Request, { params }: { params: Promise<{ tableId: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const { tableId } = await params;
  const store = await readBookingStore();
  const table = store.tables.find((candidate) => candidate.id === tableId);
  if (!table) return NextResponse.json({ error: "Table not found." }, { status: 404 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const url = `${origin}/order?type=dine-in&table=${encodeURIComponent(table.name)}`;
  return new Response(qrSvg(url, table.name), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "content-disposition": `attachment; filename="${table.name.toLowerCase().replaceAll(" ", "-")}-qr.svg"`
    }
  });
}
