import { createHmac, timingSafeEqual } from "node:crypto";
import type { RestaurantTable } from "@saba/shared";

function qrSecret() {
  return process.env.TABLE_QR_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? "saba-cafe-table-qr-development-secret";
}

export function tableQrToken(table: Pick<RestaurantTable, "id" | "name">) {
  return createHmac("sha256", qrSecret()).update(`${table.id}:${table.name}`).digest("hex").slice(0, 32);
}

export function isValidTableQrToken(table: Pick<RestaurantTable, "id" | "name">, token?: string | null) {
  if (!token) return false;
  const expected = tableQrToken(table);
  const received = String(token);
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
