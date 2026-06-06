import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { prisma } from "@saba/database";
import bundledWebsiteEvents from "../../data/website-events.json";
import bundledAdminActivity from "../../data/admin-activity.json";
import type { AdminSession } from "./adminSession";

const db = prisma as any;

export type WebsiteEventType =
  | "page_view"
  | "menu_view"
  | "add_to_cart"
  | "checkout_start"
  | "booking_form_view"
  | "booking_submit"
  | "order_complete";

export type AdminActivityType =
  | "admin_login"
  | "order_status_update"
  | "booking_status_update"
  | "menu_update"
  | "review_moderation"
  | "settings_update";

export type WebsiteEvent = {
  id: string;
  type: WebsiteEventType;
  path: string;
  sessionId?: string;
  createdAt: string;
};

export type AdminActivityLog = {
  id: string;
  type: AdminActivityType;
  message: string;
  adminId?: string;
  username?: string;
  role?: string;
  entityId?: string;
  createdAt: string;
};

type EventStore<T> = {
  events: T[];
  updatedAt: string;
};

const eventTypes = new Set<WebsiteEventType>([
  "page_view",
  "menu_view",
  "add_to_cart",
  "checkout_start",
  "booking_form_view",
  "booking_submit",
  "order_complete"
]);

const adminActivityTypes = new Set<AdminActivityType>([
  "admin_login",
  "order_status_update",
  "booking_status_update",
  "menu_update",
  "review_moderation",
  "settings_update"
]);

function candidatePaths(fileName: string) {
  return [
    path.join(process.cwd(), "data", fileName),
    path.join(process.cwd(), "apps", "web", "data", fileName),
    path.join("/tmp", "saba-cafe", fileName)
  ];
}

async function readFirstAvailable<T>(fileName: string, bundled: EventStore<T>) {
  for (const storePath of candidatePaths(fileName)) {
    try {
      return await fs.readFile(storePath, "utf8");
    } catch {
      // Keep analytics reads safe in serverless/demo environments.
    }
  }
  return JSON.stringify(bundled);
}

async function writablePath(fileName: string) {
  for (const storePath of candidatePaths(fileName)) {
    try {
      await fs.mkdir(path.dirname(storePath), { recursive: true });
      await fs.access(path.dirname(storePath), fsConstants.W_OK);
      return storePath;
    } catch {
      // Try next candidate.
    }
  }
  return candidatePaths(fileName).at(-1) as string;
}

async function readStore<T>(fileName: string, bundled: EventStore<T>): Promise<EventStore<T>> {
  try {
    const parsed = JSON.parse(await readFirstAvailable(fileName, bundled)) as Partial<EventStore<T>>;
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString()
    };
  } catch {
    return { events: [], updatedAt: new Date().toISOString() };
  }
}

async function writeStore<T>(fileName: string, store: EventStore<T>) {
  const storePath = await writablePath(fileName);
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, `${JSON.stringify({ ...store, updatedAt: new Date().toISOString() }, null, 2)}\n`);
}

async function addEnumValue(typeName: string, value: string) {
  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN
        ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}';
      END IF;
    END $$;
  `);
}

async function ensureEventSchema() {
  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WebsiteEventType') THEN
        CREATE TYPE "WebsiteEventType" AS ENUM ('page_view', 'menu_view', 'add_to_cart', 'checkout_start', 'booking_form_view', 'booking_submit', 'order_complete');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminActivityType') THEN
        CREATE TYPE "AdminActivityType" AS ENUM ('admin_login', 'order_status_update', 'booking_status_update', 'menu_update', 'review_moderation', 'settings_update');
      END IF;
    END $$;
  `);
  for (const type of eventTypes) await addEnumValue("WebsiteEventType", type);
  for (const type of adminActivityTypes) await addEnumValue("AdminActivityType", type);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WebsiteEvent" (
      "id" TEXT PRIMARY KEY,
      "type" "WebsiteEventType" NOT NULL,
      "path" TEXT NOT NULL,
      "sessionId" TEXT,
      "userId" TEXT,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminActivityLog" (
      "id" TEXT PRIMARY KEY,
      "type" "AdminActivityType" NOT NULL,
      "message" TEXT NOT NULL,
      "adminId" TEXT,
      "username" TEXT,
      "role" TEXT,
      "entityId" TEXT,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WebsiteEvent_type_idx" ON "WebsiteEvent"("type");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WebsiteEvent_createdAt_idx" ON "WebsiteEvent"("createdAt");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WebsiteEvent_sessionId_idx" ON "WebsiteEvent"("sessionId");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AdminActivityLog_type_idx" ON "AdminActivityLog"("type");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AdminActivityLog_adminId_idx" ON "AdminActivityLog"("adminId");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AdminActivityLog_createdAt_idx" ON "AdminActivityLog"("createdAt");`);
}

function dateToIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export async function readWebsiteEvents() {
  try {
    await ensureEventSchema();
    const rows = (await db.$queryRawUnsafe(`SELECT "id", "type", "path", "sessionId", "createdAt" FROM "WebsiteEvent" ORDER BY "createdAt" DESC LIMIT 5000`)) as any[];
    return {
      events: rows.map((row) => ({
        id: row.id,
        type: row.type,
        path: row.path,
        sessionId: row.sessionId ?? undefined,
        createdAt: dateToIso(row.createdAt)
      })),
      updatedAt: new Date().toISOString()
    } satisfies EventStore<WebsiteEvent>;
  } catch {
    return readStore<WebsiteEvent>("website-events.json", bundledWebsiteEvents as EventStore<WebsiteEvent>);
  }
}

export async function trackWebsiteEvent(input: { type: string; path?: string; sessionId?: string }) {
  if (!eventTypes.has(input.type as WebsiteEventType)) return;
  const event: WebsiteEvent = {
    id: `web-${randomBytes(8).toString("hex")}`,
    type: input.type as WebsiteEventType,
    path: input.path?.slice(0, 180) || "/",
    sessionId: input.sessionId?.slice(0, 120),
    createdAt: new Date().toISOString()
  };
  try {
    await ensureEventSchema();
    await db.$executeRawUnsafe(
      `INSERT INTO "WebsiteEvent" ("id", "type", "path", "sessionId", "createdAt") VALUES ($1, $2::"WebsiteEventType", $3, $4, $5)`,
      event.id,
      event.type,
      event.path,
      event.sessionId ?? null,
      new Date(event.createdAt)
    );
  } catch {
    const store = await readStore<WebsiteEvent>("website-events.json", bundledWebsiteEvents as EventStore<WebsiteEvent>);
    await writeStore("website-events.json", { ...store, events: [event, ...store.events].slice(0, 5000) });
  }
}

export async function readAdminActivity() {
  try {
    await ensureEventSchema();
    const rows = (await db.$queryRawUnsafe(`SELECT "id", "type", "message", "adminId", "username", "role", "entityId", "createdAt" FROM "AdminActivityLog" ORDER BY "createdAt" DESC LIMIT 2000`)) as any[];
    return {
      events: rows.map((row) => ({
        id: row.id,
        type: row.type,
        message: row.message,
        adminId: row.adminId ?? undefined,
        username: row.username ?? undefined,
        role: row.role ?? undefined,
        entityId: row.entityId ?? undefined,
        createdAt: dateToIso(row.createdAt)
      })),
      updatedAt: new Date().toISOString()
    } satisfies EventStore<AdminActivityLog>;
  } catch {
    return readStore<AdminActivityLog>("admin-activity.json", bundledAdminActivity as EventStore<AdminActivityLog>);
  }
}

export async function logAdminActivity(input: {
  type: AdminActivityType;
  message: string;
  session?: AdminSession | null;
  entityId?: string;
}) {
  if (!adminActivityTypes.has(input.type)) return;
  const event: AdminActivityLog = {
    id: `act-${randomBytes(8).toString("hex")}`,
    type: input.type,
    message: input.message.slice(0, 240),
    adminId: input.session?.id,
    username: input.session?.username,
    role: input.session?.role,
    entityId: input.entityId,
    createdAt: new Date().toISOString()
  };
  try {
    await ensureEventSchema();
    await db.$executeRawUnsafe(
      `INSERT INTO "AdminActivityLog" ("id", "type", "message", "adminId", "username", "role", "entityId", "createdAt")
       VALUES ($1, $2::"AdminActivityType", $3, $4, $5, $6, $7, $8)`,
      event.id,
      event.type,
      event.message,
      event.adminId ?? null,
      event.username ?? null,
      event.role ?? null,
      event.entityId ?? null,
      new Date(event.createdAt)
    );
  } catch {
    const store = await readStore<AdminActivityLog>("admin-activity.json", bundledAdminActivity as EventStore<AdminActivityLog>);
    await writeStore("admin-activity.json", { ...store, events: [event, ...store.events].slice(0, 2000) });
  }
}
