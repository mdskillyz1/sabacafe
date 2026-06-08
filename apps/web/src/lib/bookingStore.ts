import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import bundledBookingStore from "../../data/booking-store.json";
import type {
  Booking,
  BookingSlot,
  BookingStatus,
  BookingStore,
  BookingAvailabilityRule,
  RestaurantTable
} from "@saba/shared";

const storeFileName = "booking-store.json";
const runtimeStorePath = path.join("/tmp", "saba-cafe", storeFileName);
const bundledStorePaths = [
  path.join(process.cwd(), "data", storeFileName),
  path.join(process.cwd(), "apps", "web", "data", storeFileName)
];
const candidateStorePaths = process.env.VERCEL ? [runtimeStorePath, ...bundledStorePaths] : [...bundledStorePaths, runtimeStorePath];
const bookingBlocks = new Set<BookingStatus>(["PENDING", "CONFIRMED", "SEATED"]);
let writeQueue = Promise.resolve();

const defaultAvailability = [] satisfies BookingAvailabilityRule[];
const sabaDefaultTables = [
  { id: "table-01", name: "Table 01", capacity: 4, active: true },
  { id: "table-05", name: "Table 05", capacity: 4, active: true },
  { id: "table-09", name: "Table 09", capacity: 4, active: true },
  { id: "table-14", name: "Table 14", capacity: 4, active: true },
  { id: "table-18", name: "Table 18", capacity: 4, active: true },
  { id: "table-36", name: "Table 36", capacity: 4, active: true },
  { id: "table-33", name: "Table 33", capacity: 4, active: true },
  { id: "table-27", name: "Table 27", capacity: 4, active: true },
  { id: "table-22", name: "Table 22", capacity: 4, active: true },
  { id: "takeaway", name: "Takeaway", capacity: 1, active: true }
];

const defaultStore = (): BookingStore => ({
  updatedAt: new Date().toISOString(),
  tables: sabaDefaultTables,
  availability: defaultAvailability,
  blockedDates: [],
  blockedTimeSlots: [],
  specialOpeningHours: [],
  bookings: [],
  managerEmail: ""
});

async function readFirstAvailableStore() {
  for (const storePath of candidateStorePaths) {
    try {
      return await fs.readFile(storePath, "utf8");
    } catch {
      // Fall through to bundled defaults so booking widgets never crash production.
    }
  }
  return JSON.stringify(bundledBookingStore);
}

async function writableStorePath() {
  for (const storePath of candidateStorePaths) {
    try {
      await fs.mkdir(path.dirname(storePath), { recursive: true });
      await fs.access(path.dirname(storePath), fsConstants.W_OK);
      return storePath;
    } catch {
      // Try the next candidate, ending with /tmp.
    }
  }
  return candidateStorePaths[candidateStorePaths.length - 1];
}

const pad = (value: number) => String(value).padStart(2, "0");

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(dateKey: string, days: number) {
  const [year, month, date] = dateKey.split("-").map(Number);
  const next = new Date(year, month - 1, date + days);
  return todayKey(next);
}

function dayOfWeek(dateKey: string) {
  const [year, month, date] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, date).getDay();
}

function minutes(time: string) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function timeFromMinutes(value: number) {
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return minutes(startA) < minutes(endB) && minutes(startB) < minutes(endA);
}

function sortTables(tables: RestaurantTable[]) {
  return [...tables].sort((a, b) => a.capacity - b.capacity || a.name.localeCompare(b.name));
}

function withRequiredTables(tables: RestaurantTable[]) {
  const tableIds = new Set(tables.map((table) => table.id));
  const required = sabaDefaultTables.filter((table) => table.id === "takeaway" && !tableIds.has(table.id));
  return required.length ? [...tables, ...required] : tables;
}

export async function readBookingStore(): Promise<BookingStore> {
  try {
    const raw = await readFirstAvailableStore();
    const parsed = JSON.parse(raw) as Partial<BookingStore>;
    return {
      ...defaultStore(),
      ...parsed,
      tables: withRequiredTables(parsed.tables ?? defaultStore().tables),
      availability: parsed.availability ?? defaultAvailability,
      blockedDates: parsed.blockedDates ?? [],
      blockedTimeSlots: parsed.blockedTimeSlots ?? [],
      specialOpeningHours: parsed.specialOpeningHours ?? [],
      bookings: parsed.bookings ?? [],
      managerEmail: parsed.managerEmail ?? ""
    };
  } catch {
    return defaultStore();
  }
}

export async function writeBookingStore(store: BookingStore) {
  const next = { ...store, updatedAt: new Date().toISOString() };
  writeQueue = writeQueue.then(async () => {
    const storePath = await writableStorePath();
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, `${JSON.stringify(next, null, 2)}\n`);
  });
  await writeQueue;
  return next;
}

function ruleForDate(store: BookingStore, date: string): BookingAvailabilityRule | undefined {
  const special = store.specialOpeningHours.find((row) => row.date === date);
  const base = store.availability.find((row) => row.dayOfWeek === dayOfWeek(date));
  if (!base && !special) return undefined;
  if (special?.open === false) return undefined;
  const startTime = special?.startTime ?? base?.startTime;
  const endTime = special?.endTime ?? base?.endTime;
  if (!startTime || !endTime) return undefined;
  return {
    ...(base ?? {
      id: `special-${date}`,
      dayOfWeek: dayOfWeek(date),
      open: true,
      startTime,
      endTime,
      slotDurationMinutes: 60,
      bufferMinutes: 15,
      maxPartySize: 6,
      requiresApproval: true
    }),
    open: special?.open ?? base?.open ?? true,
    startTime,
    endTime,
    slotDurationMinutes: special?.slotDurationMinutes ?? base?.slotDurationMinutes ?? 60,
    bufferMinutes: special?.bufferMinutes ?? base?.bufferMinutes ?? 15,
    maxPartySize: special?.maxPartySize ?? base?.maxPartySize ?? 6,
    requiresApproval: special?.requiresApproval ?? base?.requiresApproval ?? true
  };
}

function isDateBlocked(store: BookingStore, date: string) {
  return store.blockedDates.some((blocked) => blocked.date === date);
}

function isSlotBlocked(store: BookingStore, date: string, startTime: string, endTime: string) {
  const dow = dayOfWeek(date);
  return store.blockedTimeSlots.some((blocked) => {
    const dateMatches = blocked.date ? blocked.date === date : blocked.dayOfWeek === dow;
    return dateMatches && rangesOverlap(startTime, endTime, blocked.startTime, blocked.endTime);
  });
}

function occupiedTableIds(store: BookingStore, date: string, startTime: string, endTime: string) {
  return new Set(
    store.bookings
      .filter((booking) => booking.tableId && booking.date === date && bookingBlocks.has(booking.status))
      .filter((booking) => rangesOverlap(startTime, endTime, booking.startTime, booking.endTime))
      .map((booking) => booking.tableId as string)
  );
}

export function getAvailableSlotsFromStore(store: BookingStore, date: string, partySize: number): BookingSlot[] {
  const rule = ruleForDate(store, date);
  if (!rule?.open || isDateBlocked(store, date) || partySize > rule.maxPartySize) return [];
  const activeTables = sortTables(store.tables.filter((table) => table.active && table.id !== "takeaway" && table.capacity >= partySize));
  if (!activeTables.length) return [];

  const slots: BookingSlot[] = [];
  const step = Math.max(15, rule.slotDurationMinutes + rule.bufferMinutes);
  const duration = Math.max(15, rule.slotDurationMinutes);
  for (let start = minutes(rule.startTime); start + duration <= minutes(rule.endTime); start += step) {
    const startTime = timeFromMinutes(start);
    const endTime = timeFromMinutes(start + duration);
    if (isSlotBlocked(store, date, startTime, endTime)) continue;
    const occupied = occupiedTableIds(store, date, startTime, endTime);
    const tableIds = activeTables.filter((table) => !occupied.has(table.id)).map((table) => table.id);
    slots.push({
      date,
      startTime,
      endTime,
      available: tableIds.length > 0,
      remainingTables: tableIds.length,
      tableIds,
      reason: tableIds.length ? undefined : "Fully booked"
    });
  }
  return slots;
}

export async function getAvailableDates(days = 45, partySize = 2) {
  const store = await readBookingStore();
  const start = todayKey();
  return Array.from({ length: days }, (_, index) => addDays(start, index))
    .map((date) => ({ date, available: getAvailableSlotsFromStore(store, date, partySize).some((slot) => slot.available) }));
}

export async function getAvailableSlots(date: string, partySize: number) {
  const store = await readBookingStore();
  return getAvailableSlotsFromStore(store, date, partySize);
}

export async function createBooking(input: {
  customerName: string;
  email?: string;
  phone: string;
  partySize: number;
  date: string;
  startTime: string;
  notes?: string;
}) {
  const store = await readBookingStore();
  const slots = getAvailableSlotsFromStore(store, input.date, input.partySize);
  const slot = slots.find((candidate) => candidate.startTime === input.startTime && candidate.available);
  if (!slot) {
    throw new Error("Selected booking time is no longer available.");
  }
  const rule = ruleForDate(store, input.date);
  const table = sortTables(store.tables.filter((candidate) => slot.tableIds.includes(candidate.id)))[0];
  if (!table || !rule) {
    throw new Error("No suitable table is available for this booking.");
  }
  const now = new Date().toISOString();
  const booking: Booking = {
    id: crypto.randomUUID(),
    tableId: table.id,
    customerName: input.customerName.trim(),
    email: input.email?.trim() || undefined,
    phone: input.phone.trim(),
    partySize: input.partySize,
    date: input.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    notes: input.notes?.trim() || undefined,
    status: "PENDING",
    requiresApproval: true,
    createdAt: now,
    updatedAt: now
  };
  const saved = await writeBookingStore({ ...store, bookings: [booking, ...store.bookings] });
  await queueManagerBookingEmail(store.managerEmail, booking);
  return saved.bookings.find((candidate) => candidate.id === booking.id) ?? booking;
}

async function queueManagerBookingEmail(managerEmail: string | undefined, booking: Booking) {
  if (!managerEmail) return;
  // Email provider wiring belongs here later. The booking remains pending until staff approve it.
  console.info(`Booking approval email ready for ${managerEmail}: ${booking.date} ${booking.startTime} for ${booking.partySize}`);
}

export async function updateBookingStatus(id: string, status: BookingStatus, adminNotes?: string) {
  const store = await readBookingStore();
  const updatedAt = new Date().toISOString();
  const bookings = store.bookings.map((booking) =>
    booking.id === id ? { ...booking, status, adminNotes: adminNotes ?? booking.adminNotes, updatedAt } : booking
  );
  await writeBookingStore({ ...store, bookings });
  return bookings.find((booking) => booking.id === id);
}
