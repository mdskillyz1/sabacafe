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

function qrSvg(url: string, label: string, origin: string) {
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&amp;data=${encodeURIComponent(url)}`;
  const logoUrl = `${origin}/brand/saba-logo.jpeg`;
  const safeUrl = escapeXml(url);
  const safeLabel = escapeXml(label);
  const safeLogoUrl = escapeXml(logoUrl);
  const isTakeaway = label.toLowerCase().includes("takeaway");
  const tableLabel = isTakeaway ? "TAKEAWAY" : safeLabel.toUpperCase();
  const eyebrow = isTakeaway ? "ORDER AT THE DESK" : "TABLE ORDERING";
  const subtitle = isTakeaway ? "Scan to order now" : "Scan to order from your table";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
    <defs>
      <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#181411"/>
        <stop offset="0.42" stop-color="#2f241e"/>
        <stop offset="1" stop-color="#0e0b09"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#f6d98a"/>
        <stop offset="0.28" stop-color="#b77823"/>
        <stop offset="0.58" stop-color="#f2ca67"/>
        <stop offset="1" stop-color="#8f5c18"/>
      </linearGradient>
      <linearGradient id="softGold" x1="0" x2="1">
        <stop offset="0" stop-color="#c38a2e"/>
        <stop offset="0.5" stop-color="#f6df9d"/>
        <stop offset="1" stop-color="#c38a2e"/>
      </linearGradient>
      <pattern id="brush" width="18" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 3h18M0 10h18M0 16h18" stroke="#ffffff" stroke-width="1" opacity="0.025"/>
        <path d="M3 0v18M12 0v18" stroke="#f6d98a" stroke-width="1" opacity="0.018"/>
      </pattern>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.42"/>
      </filter>
    </defs>
    <rect width="900" height="1200" fill="#111111"/>
    <rect x="54" y="54" width="792" height="1092" rx="56" fill="url(#metal)" filter="url(#shadow)"/>
    <rect x="54" y="54" width="792" height="1092" rx="56" fill="url(#brush)"/>
    <rect x="82" y="82" width="736" height="1036" rx="42" fill="none" stroke="url(#gold)" stroke-width="6"/>
    <rect x="104" y="104" width="692" height="992" rx="32" fill="none" stroke="#f7e7b5" stroke-width="1.5" opacity="0.38"/>

    <image href="${safeLogoUrl}" x="278" y="105" width="344" height="178" preserveAspectRatio="xMidYMid meet"/>
    <text x="450" y="326" text-anchor="middle" font-size="24" font-family="Arial,sans-serif" font-weight="700" letter-spacing="8" fill="#e1b85d">${eyebrow}</text>
    <line x1="174" y1="360" x2="726" y2="360" stroke="url(#softGold)" stroke-width="3"/>

    <text x="450" y="438" text-anchor="middle" font-size="82" font-family="Georgia,serif" font-weight="700" letter-spacing="5" fill="#fff8e8">${tableLabel}</text>
    <text x="450" y="491" text-anchor="middle" font-size="30" font-family="Arial,sans-serif" fill="#dcc6a3">${escapeXml(subtitle)}</text>

    <rect x="203" y="535" width="494" height="494" rx="36" fill="#fffdf7" stroke="url(#gold)" stroke-width="9"/>
    <rect x="229" y="561" width="442" height="442" rx="18" fill="#ffffff"/>
    <image href="${qrImage}" x="250" y="582" width="400" height="400"/>

    <g transform="translate(172 1060)">
      <circle cx="34" cy="34" r="31" fill="none" stroke="url(#gold)" stroke-width="4"/>
      <text x="34" y="45" text-anchor="middle" font-size="34" font-family="Arial,sans-serif" font-weight="700" fill="#f7e7b5">1</text>
      <text x="92" y="28" font-size="24" font-family="Arial,sans-serif" font-weight="700" fill="#fff8e8">SCAN</text>
      <text x="92" y="58" font-size="18" font-family="Arial,sans-serif" fill="#dcc6a3">with your camera</text>
    </g>
    <g transform="translate(500 1060)">
      <circle cx="34" cy="34" r="31" fill="none" stroke="url(#gold)" stroke-width="4"/>
      <text x="34" y="45" text-anchor="middle" font-size="34" font-family="Arial,sans-serif" font-weight="700" fill="#f7e7b5">2</text>
      <text x="92" y="28" font-size="24" font-family="Arial,sans-serif" font-weight="700" fill="#fff8e8">ORDER</text>
      <text x="92" y="58" font-size="18" font-family="Arial,sans-serif" fill="#dcc6a3">pay at counter</text>
    </g>

    <text x="450" y="1168" text-anchor="middle" font-size="17" font-family="Arial,sans-serif" letter-spacing="4" fill="#b98a3a">SABA CAFE &#8226; 152 OLD KENT ROAD</text>
    <metadata>${safeUrl}</metadata>
  </svg>`;
}

export async function GET(request: Request, { params }: { params: Promise<{ tableId: string }> }) {
  const session = adminSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  const { tableId } = await params;
  const store = await readBookingStore();
  const table = store.tables.find((candidate) => candidate.id === tableId);
  if (!table) return NextResponse.json({ error: "Table not found." }, { status: 404 });
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sabacafe.co.uk").replace(/\/$/, "");
  const url = `${origin}/order?type=dine-in&table=${encodeURIComponent(table.name)}`;
  return new Response(qrSvg(url, table.name, origin), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "content-disposition": `attachment; filename="${table.name.toLowerCase().replaceAll(" ", "-")}-qr.svg"`
    }
  });
}
