import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import bundledWebsiteEvents from "../../data/website-events.json";
import bundledAdminActivity from "../../data/admin-activity.json";
import type { AdminSession } from "./adminSession";

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

export async function readWebsiteEvents() {
  return readStore<WebsiteEvent>("website-events.json", bundledWebsiteEvents as EventStore<WebsiteEvent>);
}

export async function trackWebsiteEvent(input: { type: string; path?: string; sessionId?: string }) {
  if (!eventTypes.has(input.type as WebsiteEventType)) return;
  const store = await readWebsiteEvents();
  const event: WebsiteEvent = {
    id: `web-${randomBytes(8).toString("hex")}`,
    type: input.type as WebsiteEventType,
    path: input.path?.slice(0, 180) || "/",
    sessionId: input.sessionId?.slice(0, 120),
    createdAt: new Date().toISOString()
  };
  await writeStore("website-events.json", { ...store, events: [event, ...store.events].slice(0, 5000) });
}

export async function readAdminActivity() {
  return readStore<AdminActivityLog>("admin-activity.json", bundledAdminActivity as EventStore<AdminActivityLog>);
}

export async function logAdminActivity(input: {
  type: AdminActivityType;
  message: string;
  session?: AdminSession | null;
  entityId?: string;
}) {
  if (!adminActivityTypes.has(input.type)) return;
  const store = await readAdminActivity();
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
  await writeStore("admin-activity.json", { ...store, events: [event, ...store.events].slice(0, 2000) });
}
