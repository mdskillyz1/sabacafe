"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { CalendarDays, Check, Clock, Plus, Save, Trash2, X } from "lucide-react";
import type {
  BlockedDate,
  BlockedTimeSlot,
  Booking,
  BookingAvailabilityRule,
  BookingStatus,
  BookingStore,
  RestaurantTable,
  SpecialOpeningHours
} from "@saba/shared";

const statuses: BookingStatus[] = ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "SEATED", "COMPLETED"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const today = new Date().toISOString().slice(0, 10);

const emptyStore: BookingStore = {
  updatedAt: "",
  tables: [],
  availability: [],
  blockedDates: [],
  blockedTimeSlots: [],
  specialOpeningHours: [],
  bookings: []
};
const sabaDefaultTables: RestaurantTable[] = [
  { id: "table-01", name: "Table 01", capacity: 4, active: true },
  { id: "table-05", name: "Table 05", capacity: 4, active: true },
  { id: "table-09", name: "Table 09", capacity: 4, active: true },
  { id: "table-14", name: "Table 14", capacity: 4, active: true },
  { id: "table-18", name: "Table 18", capacity: 4, active: true },
  { id: "table-36", name: "Table 36", capacity: 4, active: true },
  { id: "table-33", name: "Table 33", capacity: 4, active: true },
  { id: "table-27", name: "Table 27", capacity: 4, active: true },
  { id: "table-22", name: "Table 22", capacity: 4, active: true }
];

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function tableName(tables: RestaurantTable[], id?: string) {
  return tables.find((table) => table.id === id)?.name ?? "Unassigned";
}

export function AdminBookingsManager() {
  const [store, setStore] = useState<BookingStore>(emptyStore);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("ALL");
  const [date, setDate] = useState(today);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [settingsResponse, bookingsResponse] = await Promise.all([
      fetch("/api/admin/bookings/settings", { cache: "no-store" }),
      fetch(`/api/admin/bookings?date=${date}&status=${status}`, { cache: "no-store" })
    ]);
    setStore(await settingsResponse.json());
    const bookingData = await bookingsResponse.json();
    setBookings(bookingData.bookings ?? []);
  }

  useEffect(() => {
    load();
  }, [date, status]);

  const dailyStats = useMemo(() => {
    return statuses.map((entry) => ({ status: entry, count: bookings.filter((booking) => booking.status === entry).length }));
  }, [bookings]);

  async function saveStore(nextStore: BookingStore, successMessage = "Booking settings saved.") {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/bookings/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextStore)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Booking settings could not be saved.");
      setStore(data);
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    await saveStore(store);
  }

  async function useSabaTables() {
    const nextStore = { ...store, tables: sabaDefaultTables };
    setStore(nextStore);
    await saveStore(nextStore, "Saba Cafe default tables saved.");
  }

  async function changeStatus(id: string, nextStatus: BookingStatus, adminNotes?: string) {
    const response = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, adminNotes })
    });
    const data = await response.json();
    if (response.ok) {
      setBookings((current) => current.map((booking) => (booking.id === id ? data.booking : booking)));
    }
  }

  const updateTable = (id: string, patch: Partial<RestaurantTable>) =>
    setStore((current) => ({ ...current, tables: current.tables.map((table) => (table.id === id ? { ...table, ...patch } : table)) }));

  const updateRule = (id: string, patch: Partial<BookingAvailabilityRule>) =>
    setStore((current) => ({
      ...current,
      availability: current.availability.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule))
    }));

  function addAvailabilityRule() {
    setStore((current) => {
      const usedDays = new Set(current.availability.map((rule) => rule.dayOfWeek));
      const dayOfWeek = [1, 2, 3, 4, 5, 6, 0].find((day) => !usedDays.has(day)) ?? 1;
      return {
        ...current,
        availability: [
          ...current.availability,
          {
            id: uid("availability"),
            dayOfWeek,
            open: true,
            startTime: "",
            endTime: "",
            slotDurationMinutes: 60,
            bufferMinutes: 15,
            maxPartySize: 6,
            requiresApproval: true
          }
        ]
      };
    });
  }

  return (
    <section className="mt-8 space-y-8">
      {message ? <p className="rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint">{message}</p> : null}

      <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <div>
            <h2 className="font-display text-3xl font-semibold text-date">Manager notifications</h2>
            <p className="mt-2 text-sm leading-6 text-date/65">
              Each new booking request is approval-only. Email sending will be connected later; this manager email is ready for that setup.
            </p>
          </div>
          <label className="text-sm font-semibold text-date/70">
            Manager email
            <input
              type="email"
              value={store.managerEmail ?? ""}
              onChange={(event) => setStore((current) => ({ ...current, managerEmail: event.target.value }))}
              placeholder="manager@sabacafe.co.uk"
              className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-mint" />
            <div>
              <h2 className="font-display text-3xl font-semibold text-date">Calendar overview</h2>
              <p className="text-sm text-date/60">Filter bookings by day and status.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-date/70">
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-semibold text-date/70">
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal">
                <option value="ALL">All statuses</option>
                {statuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {dailyStats.map((entry) => (
              <div key={entry.status} className="rounded-md bg-cream p-3">
                <p className="text-xs font-bold uppercase text-date/50">{entry.status}</p>
                <p className="mt-1 font-display text-3xl font-semibold text-date">{entry.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-semibold text-date">Daily booking list</h2>
              <p className="text-sm text-date/60">Requests stay pending until staff approve them. Customers are confirmed only after approval.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {bookings.length ? bookings.map((booking) => (
              <article key={booking.id} className="rounded-md border border-date/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-date">{booking.startTime} - {booking.customerName}</p>
                    <p className="mt-1 text-sm text-date/60">
                      {booking.partySize} guest{booking.partySize === 1 ? "" : "s"} • {tableName(store.tables, booking.tableId)} • {booking.phone}
                    </p>
                    {booking.notes ? <p className="mt-2 text-sm text-date/70">Guest notes: {booking.notes}</p> : null}
                    {booking.adminNotes ? <p className="mt-2 text-sm text-clay">Admin notes: {booking.adminNotes}</p> : null}
                  </div>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-date">{booking.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => changeStatus(booking.id, "CONFIRMED")} className="rounded-full bg-mint px-3 py-2 text-xs font-semibold text-white"><Check size={14} className="inline" /> Approve</button>
                  <button onClick={() => changeStatus(booking.id, "REJECTED")} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"><X size={14} className="inline" /> Reject</button>
                  <button onClick={() => changeStatus(booking.id, "CANCELLED")} className="rounded-full border border-date/15 px-3 py-2 text-xs font-semibold text-date">Cancel</button>
                  <button onClick={() => changeStatus(booking.id, "SEATED")} className="rounded-full border border-date/15 px-3 py-2 text-xs font-semibold text-date">Seated</button>
                  <button onClick={() => changeStatus(booking.id, "COMPLETED")} className="rounded-full border border-date/15 px-3 py-2 text-xs font-semibold text-date">Completed</button>
                </div>
                <AdminNoteForm booking={booking} onSave={changeStatus} />
              </article>
            )) : (
              <p className="rounded-md bg-cream p-5 text-sm font-semibold text-date/65">No bookings match this filter.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold text-date">Table management</h2>
            <p className="text-sm text-date/60">Active tables are used by bookings and QR dine-in ordering.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useSabaTables}
              disabled={saving}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-date/15 px-4 py-3 font-semibold text-date"
            >
              Use Saba tables
            </button>
            <button
              type="button"
              onClick={() => setStore((current) => ({ ...current, tables: [...current.tables, { id: uid("table"), name: "New table", capacity: 2, active: true }] }))}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-date/15 px-4 py-3 font-semibold text-date"
            >
              <Plus size={17} /> Add table
            </button>
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-date px-4 py-3 font-semibold text-cream disabled:opacity-60"
            >
              <Save size={17} /> {saving ? "Saving..." : "Save tables"}
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {store.tables.map((table) => (
            <div key={table.id} className="grid gap-3 rounded-md border border-date/10 p-4 sm:grid-cols-[1fr_120px_auto_auto_auto]">
              <input value={table.name} onChange={(event) => updateTable(table.id, { name: event.target.value })} className="focus-ring rounded-md border border-date/15 px-3 py-3" />
              <input type="number" min={1} value={table.capacity} onChange={(event) => updateTable(table.id, { capacity: Number(event.target.value) })} className="focus-ring rounded-md border border-date/15 px-3 py-3" />
              <label className="flex items-center gap-2 text-sm font-semibold text-date/70"><input type="checkbox" checked={table.active} onChange={(event) => updateTable(table.id, { active: event.target.checked })} /> Active</label>
              <a href={`/api/admin/tables/${table.id}/qr`} className="rounded-full border border-date/15 px-3 py-2 text-center text-xs font-semibold text-date">QR</a>
              <button onClick={() => setStore((current) => ({ ...current, tables: current.tables.filter((row) => row.id !== table.id) }))} className="text-red-700"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Clock className="text-mint" />
          <div className="flex-1">
            <h2 className="font-display text-3xl font-semibold text-date">Booking availability</h2>
            <p className="text-sm text-date/60">Set opening days, start/end times, slot duration, buffers, and max party size. Approval is always required.</p>
          </div>
          <button onClick={addAvailabilityRule} className="focus-ring inline-flex items-center gap-2 rounded-full border border-date/15 px-4 py-3 font-semibold text-date">
            <Plus size={17} /> Add day
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {store.availability.length ? [...store.availability].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((rule) => (
            <div key={rule.id} className="grid gap-3 rounded-md border border-date/10 p-4 lg:grid-cols-[120px_80px_repeat(6,1fr)]">
              <select value={rule.dayOfWeek} onChange={(event) => updateRule(rule.id, { dayOfWeek: Number(event.target.value) })} className="focus-ring rounded-md border border-date/15 px-3 py-2 font-semibold text-date">
                {days.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm font-semibold text-date/70"><input type="checkbox" checked={rule.open} onChange={(event) => updateRule(rule.id, { open: event.target.checked })} /> Open</label>
              <input type="time" value={rule.startTime} onChange={(event) => updateRule(rule.id, { startTime: event.target.value })} className="focus-ring rounded-md border border-date/15 px-3 py-2" />
              <input type="time" value={rule.endTime} onChange={(event) => updateRule(rule.id, { endTime: event.target.value })} className="focus-ring rounded-md border border-date/15 px-3 py-2" />
              <select value={rule.slotDurationMinutes} onChange={(event) => updateRule(rule.id, { slotDurationMinutes: Number(event.target.value) })} className="focus-ring rounded-md border border-date/15 px-3 py-2">
                {[30, 45, 60, 90].map((value) => <option key={value} value={value}>{value} min</option>)}
              </select>
              <input type="number" min={0} value={rule.bufferMinutes} onChange={(event) => updateRule(rule.id, { bufferMinutes: Number(event.target.value) })} className="focus-ring rounded-md border border-date/15 px-3 py-2" placeholder="Buffer" />
              <input type="number" min={1} value={rule.maxPartySize} onChange={(event) => updateRule(rule.id, { maxPartySize: Number(event.target.value) })} className="focus-ring rounded-md border border-date/15 px-3 py-2" placeholder="Max party" />
              <span className="rounded-md bg-cream px-3 py-2 text-sm font-semibold text-date/70">Approval required</span>
              <button onClick={() => setStore((current) => ({ ...current, availability: current.availability.filter((candidate) => candidate.id !== rule.id) }))} className="text-left text-sm font-semibold text-red-700">Delete</button>
            </div>
          )) : (
            <p className="rounded-md bg-cream p-5 text-sm font-semibold text-date/65">
              No booking dates or times are live. Add a day and save settings before customers can book online.
            </p>
          )}
        </div>
      </div>

      <BlockManagement store={store} setStore={setStore} />

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button onClick={saveSettings} disabled={saving} className="focus-ring inline-flex items-center gap-2 rounded-full bg-date px-6 py-4 font-semibold text-cream shadow-soft disabled:opacity-60">
          <Save size={18} /> {saving ? "Saving..." : "Save booking settings"}
        </button>
      </div>
    </section>
  );
}

function AdminNoteForm({ booking, onSave }: { booking: Booking; onSave: (id: string, status: BookingStatus, notes?: string) => void }) {
  const [notes, setNotes] = useState(booking.adminNotes ?? "");
  return (
    <div className="mt-3 flex gap-2">
      <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Internal admin notes" className="focus-ring flex-1 rounded-md border border-date/15 px-3 py-2 text-sm" />
      <button onClick={() => onSave(booking.id, booking.status, notes)} className="rounded-full border border-date/15 px-3 py-2 text-xs font-semibold text-date">Save note</button>
    </div>
  );
}

function BlockManagement({ store, setStore }: { store: BookingStore; setStore: Dispatch<SetStateAction<BookingStore>> }) {
  const addBlockedDate = () =>
    setStore((current) => ({ ...current, blockedDates: [...current.blockedDates, { id: uid("blocked-date"), date: today, reason: "" }] }));
  const addBlockedSlot = () =>
    setStore((current) => ({ ...current, blockedTimeSlots: [...current.blockedTimeSlots, { id: uid("blocked-slot"), date: today, startTime: "18:00", endTime: "19:00", reason: "" }] }));
  const addSpecialHours = () =>
    setStore((current) => ({ ...current, specialOpeningHours: [...current.specialOpeningHours, { id: uid("special-hours"), date: today, open: true, startTime: "", endTime: "", note: "" }] }));

  const updateBlockedDate = (id: string, patch: Partial<BlockedDate>) =>
    setStore((current) => ({ ...current, blockedDates: current.blockedDates.map((row) => (row.id === id ? { ...row, ...patch } : row)) }));
  const updateBlockedSlot = (id: string, patch: Partial<BlockedTimeSlot>) =>
    setStore((current) => ({ ...current, blockedTimeSlots: current.blockedTimeSlots.map((row) => (row.id === id ? { ...row, ...patch } : row)) }));
  const updateSpecial = (id: string, patch: Partial<SpecialOpeningHours>) =>
    setStore((current) => ({ ...current, specialOpeningHours: current.specialOpeningHours.map((row) => (row.id === id ? { ...row, ...patch } : row)) }));

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-date">Blocked dates</h2>
          <button onClick={addBlockedDate} className="rounded-full border border-date/15 px-3 py-2 text-sm font-semibold"><Plus size={15} /></button>
        </div>
        <div className="mt-4 space-y-3">
          {store.blockedDates.map((row) => (
            <div key={row.id} className="grid gap-2 rounded-md bg-cream p-3">
              <input type="date" value={row.date} onChange={(event) => updateBlockedDate(row.id, { date: event.target.value })} className="rounded-md border border-date/15 px-3 py-2" />
              <input value={row.reason ?? ""} onChange={(event) => updateBlockedDate(row.id, { reason: event.target.value })} placeholder="Reason" className="rounded-md border border-date/15 px-3 py-2" />
              <button onClick={() => setStore((current) => ({ ...current, blockedDates: current.blockedDates.filter((item) => item.id !== row.id) }))} className="text-left text-sm font-semibold text-red-700">Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-date">Blocked slots</h2>
          <button onClick={addBlockedSlot} className="rounded-full border border-date/15 px-3 py-2 text-sm font-semibold"><Plus size={15} /></button>
        </div>
        <div className="mt-4 space-y-3">
          {store.blockedTimeSlots.map((row) => (
            <div key={row.id} className="grid gap-2 rounded-md bg-cream p-3">
              <input type="date" value={row.date ?? ""} onChange={(event) => updateBlockedSlot(row.id, { date: event.target.value || undefined, dayOfWeek: undefined })} className="rounded-md border border-date/15 px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={row.startTime} onChange={(event) => updateBlockedSlot(row.id, { startTime: event.target.value })} className="rounded-md border border-date/15 px-3 py-2" />
                <input type="time" value={row.endTime} onChange={(event) => updateBlockedSlot(row.id, { endTime: event.target.value })} className="rounded-md border border-date/15 px-3 py-2" />
              </div>
              <input value={row.reason ?? ""} onChange={(event) => updateBlockedSlot(row.id, { reason: event.target.value })} placeholder="Reason" className="rounded-md border border-date/15 px-3 py-2" />
              <button onClick={() => setStore((current) => ({ ...current, blockedTimeSlots: current.blockedTimeSlots.filter((item) => item.id !== row.id) }))} className="text-left text-sm font-semibold text-red-700">Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-date">Special hours</h2>
          <button onClick={addSpecialHours} className="rounded-full border border-date/15 px-3 py-2 text-sm font-semibold"><Plus size={15} /></button>
        </div>
        <div className="mt-4 space-y-3">
          {store.specialOpeningHours.map((row) => (
            <div key={row.id} className="grid gap-2 rounded-md bg-cream p-3">
              <input type="date" value={row.date} onChange={(event) => updateSpecial(row.id, { date: event.target.value })} className="rounded-md border border-date/15 px-3 py-2" />
              <label className="flex items-center gap-2 text-sm font-semibold text-date/70"><input type="checkbox" checked={row.open} onChange={(event) => updateSpecial(row.id, { open: event.target.checked })} /> Open</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={row.startTime ?? ""} onChange={(event) => updateSpecial(row.id, { startTime: event.target.value })} className="rounded-md border border-date/15 px-3 py-2" />
                <input type="time" value={row.endTime ?? ""} onChange={(event) => updateSpecial(row.id, { endTime: event.target.value })} className="rounded-md border border-date/15 px-3 py-2" />
              </div>
              <input value={row.note ?? ""} onChange={(event) => updateSpecial(row.id, { note: event.target.value })} placeholder="Note" className="rounded-md border border-date/15 px-3 py-2" />
              <button onClick={() => setStore((current) => ({ ...current, specialOpeningHours: current.specialOpeningHours.filter((item) => item.id !== row.id) }))} className="text-left text-sm font-semibold text-red-700">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
