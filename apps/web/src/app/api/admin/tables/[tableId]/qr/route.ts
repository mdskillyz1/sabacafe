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
  const tableLabel = isTakeaway ? "TAKEAWAY DESK" : safeLabel.toUpperCase();
  const subtitle = isTakeaway ? "Scan to order now at the desk" : `Scan to order now from ${safeLabel}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
    <defs>
      <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#d9ad55"/>
        <stop offset="0.48" stop-color="#a97022"/>
        <stop offset="1" stop-color="#f0cc76"/>
      </linearGradient>
      <linearGradient id="paper" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#fffaf1"/>
        <stop offset="0.55" stop-color="#fff3df"/>
        <stop offset="1" stop-color="#f7e4c1"/>
      </linearGradient>
      <pattern id="motif" width="46" height="46" patternUnits="userSpaceOnUse">
        <path d="M23 4c10 10 10 28 0 38C13 32 13 14 23 4Z" fill="none" stroke="#d9ad55" stroke-width="1" opacity="0.12"/>
        <circle cx="23" cy="23" r="2" fill="#d9ad55" opacity="0.1"/>
      </pattern>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#422116" flood-opacity="0.16"/>
      </filter>
    </defs>
    <rect width="900" height="1200" fill="#efe7d9"/>
    <rect x="92" y="40" width="716" height="1120" rx="48" fill="url(#paper)" filter="url(#shadow)"/>
    <rect x="116" y="66" width="668" height="1068" rx="38" fill="none" stroke="url(#gold)" stroke-width="4"/>
    <rect x="135" y="88" width="630" height="1024" rx="30" fill="url(#motif)" opacity="0.82"/>

    <image href="${safeLogoUrl}" x="276" y="112" width="348" height="190" preserveAspectRatio="xMidYMid meet"/>
    <line x1="266" y1="344" x2="386" y2="344" stroke="url(#gold)" stroke-width="3"/>
    <text x="450" y="356" text-anchor="middle" font-size="30" font-family="Georgia,serif" fill="#b8862c">&#9671; &#10070; &#9671;</text>
    <line x1="514" y1="344" x2="634" y2="344" stroke="url(#gold)" stroke-width="3"/>

    <text x="450" y="404" text-anchor="middle" font-size="34" font-family="Georgia,serif" letter-spacing="8" fill="#422116">SCAN TO ORDER NOW</text>
    <text x="450" y="462" text-anchor="middle" font-size="58" font-family="Georgia,serif" letter-spacing="4" fill="url(#gold)">${tableLabel}</text>
    <text x="450" y="508" text-anchor="middle" font-size="24" font-family="Arial,sans-serif" fill="#856f64">${escapeXml(subtitle)}</text>

    <rect x="270" y="540" width="360" height="360" rx="22" fill="#fffaf1" stroke="url(#gold)" stroke-width="5"/>
    <image href="${qrImage}" x="300" y="570" width="300" height="300"/>

    <g fill="none" stroke="#b8862c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="216" y="940" width="40" height="68" rx="8"/>
      <path d="M236 964v22m-10-10h20"/>
      <path d="M450 940h-44v68h88v-68h-44m-20 24h40m-40 18h40"/>
      <path d="M642 984h88m-76 0a32 32 0 0 1 64 0m-32-38v-16m-14 0h28"/>
    </g>
    <line x1="322" y1="944" x2="322" y2="1014" stroke="#d9ad55" stroke-width="2"/>
    <line x1="578" y1="944" x2="578" y2="1014" stroke="#d9ad55" stroke-width="2"/>
    <text x="236" y="1040" text-anchor="middle" font-size="24" font-family="Georgia,serif" letter-spacing="2" fill="#422116">SCAN</text>
    <text x="236" y="1070" text-anchor="middle" font-size="18" font-family="Arial,sans-serif" fill="#856f64">with your camera</text>
    <text x="450" y="1040" text-anchor="middle" font-size="24" font-family="Georgia,serif" letter-spacing="2" fill="#422116">BROWSE</text>
    <text x="450" y="1070" text-anchor="middle" font-size="18" font-family="Arial,sans-serif" fill="#856f64">choose your food</text>
    <text x="686" y="1040" text-anchor="middle" font-size="24" font-family="Georgia,serif" letter-spacing="2" fill="#422116">ENJOY</text>
    <text x="686" y="1070" text-anchor="middle" font-size="18" font-family="Arial,sans-serif" fill="#856f64">pay at the counter</text>

    <path d="M92 1072c180-94 360-75 716-128v216H92Z" fill="url(#gold)" opacity="0.25"/>
    <path d="M102 1102c220-70 386-72 696-130" fill="none" stroke="url(#gold)" stroke-width="12" opacity="0.86"/>
    <text x="450" y="1132" text-anchor="middle" font-size="30" font-family="Georgia,serif" letter-spacing="6" fill="#422116">THANK YOU</text>
    <text x="450" y="1166" text-anchor="middle" font-size="17" font-family="Arial,sans-serif" letter-spacing="4" fill="#856f64">SABA CAFE &#8226; 152 OLD KENT ROAD</text>
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
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const url = `${origin}/order?type=dine-in&table=${encodeURIComponent(table.name)}`;
  return new Response(qrSvg(url, table.name, origin), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "content-disposition": `attachment; filename="${table.name.toLowerCase().replaceAll(" ", "-")}-qr.svg"`
    }
  });
}
