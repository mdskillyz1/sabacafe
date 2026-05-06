"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, Users } from "lucide-react";
import type { BookingSlot } from "@saba/shared";

type DateAvailability = {
  date: string;
  available: boolean;
};

const presetPartySizes = [1, 2, 3, 4, 5, 6];
const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

function labelDate(date: string) {
  return fmt.format(new Date(`${date}T12:00:00`));
}

function monthLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

export function BookingWidget() {
  const [partySize, setPartySize] = useState(2);
  const [partySizeMode, setPartySizeMode] = useState<"preset" | "custom">("preset");
  const [dates, setDates] = useState<DateAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingDates(true);
    setSelectedDate("");
    setSelectedSlot("");
    setSlots([]);
    fetch(`/api/bookings/dates?days=45&partySize=${partySize}`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        const nextDates = data.dates ?? [];
        setDates(nextDates);
        setSelectedDate(nextDates.find((date: DateAvailability) => date.available)?.date ?? "");
      })
      .catch(() => setError("Booking dates could not be loaded. Please call us to book."))
      .finally(() => active && setLoadingDates(false));
    return () => {
      active = false;
    };
  }, [partySize]);

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    setLoadingSlots(true);
    setSelectedSlot("");
    fetch(`/api/bookings/slots?date=${selectedDate}&partySize=${partySize}`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setSlots(data.slots ?? []);
      })
      .catch(() => setError("Booking times could not be loaded. Please try another date."))
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [selectedDate, partySize]);

  const groupedDates = useMemo(() => {
    return dates.reduce<Record<string, DateAvailability[]>>((groups, date) => {
      const key = monthLabel(date.date);
      groups[key] = [...(groups[key] ?? []), date];
      return groups;
    }, {});
  }, [dates]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!selectedDate || !selectedSlot) {
      setError("Please choose an available date and time.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        phone: form.get("phone"),
        email: form.get("email"),
        partySize,
        date: selectedDate,
        startTime: selectedSlot,
        notes: form.get("notes")
      })
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setError(data.message ?? "This time is no longer available. Please choose another slot.");
      return;
    }
    setMessage(
      `Booking request sent for ${labelDate(selectedDate)} at ${selectedSlot}. This is not confirmed yet. Staff will approve it and send your confirmation.`
    );
    setSelectedSlot("");
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-cream p-6 text-date shadow-soft">
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-1 text-mint" />
        <div>
          <h3 className="font-display text-3xl font-semibold">Book a table</h3>
          <p className="mt-2 text-sm leading-6 text-date/65">Start with your guest size. If tables are available, choose a date and time before adding your contact details.</p>
        </div>
      </div>

      <label className="mt-5 block text-sm font-semibold text-date/70">
        Party size
        <span className="mt-1 flex items-center gap-2 rounded-md border border-date/15 bg-white px-3 py-2">
          <Users size={17} className="text-clay" />
          <select
            value={partySizeMode === "custom" ? "more" : partySize}
            onChange={(event) => {
              if (event.target.value === "more") {
                setPartySizeMode("custom");
                setPartySize(Math.max(7, partySize));
              } else {
                setPartySizeMode("preset");
                setPartySize(Number(event.target.value));
              }
            }}
            className="w-full bg-transparent py-1 outline-none"
          >
            {presetPartySizes.map((size) => (
              <option key={size} value={size}>{size} guest{size === 1 ? "" : "s"}</option>
            ))}
            <option value="more">More</option>
          </select>
        </span>
      </label>
      {partySizeMode === "custom" ? (
        <label className="mt-3 block text-sm font-semibold text-date/70">
          Number of guests
          <input
            type="number"
            min={7}
            max={50}
            value={partySize}
            onChange={(event) => setPartySize(Math.max(7, Number(event.target.value) || 7))}
            className="focus-ring mt-1 w-full rounded-md border border-date/15 bg-white px-4 py-3 font-normal"
          />
        </label>
      ) : null}

      <div className="mt-5">
        <p className="text-sm font-semibold text-date/70">Select date</p>
        {loadingDates ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-date/60"><Loader2 className="animate-spin" size={16} /> Loading available dates</p>
        ) : (
          dates.some((date) => date.available) ? (
            <div className="mt-2 max-h-72 space-y-4 overflow-auto rounded-md border border-date/10 bg-white p-3">
              {Object.entries(groupedDates).map(([month, monthDates]) => (
                <div key={month}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">{month}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {monthDates.map((date) => (
                      <button
                        key={date.date}
                        type="button"
                        disabled={!date.available}
                        onClick={() => setSelectedDate(date.date)}
                        className={`rounded-md border px-3 py-3 text-left text-sm font-semibold transition ${
                          selectedDate === date.date
                            ? "border-mint bg-mint text-white"
                            : date.available
                              ? "border-date/10 bg-cream text-date hover:border-mint"
                              : "cursor-not-allowed border-date/5 bg-date/5 text-date/35"
                        }`}
                      >
                        {labelDate(date.date)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-md bg-white p-4 text-sm font-semibold text-date/65">
              No booking slots are available online yet. Please call us on <a className="text-mint underline" href="tel:+442080509600">020 8050 9600</a>.
            </p>
          )
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-date/70">Available time slots</p>
        {loadingSlots ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-date/60"><Loader2 className="animate-spin" size={16} /> Loading times</p>
        ) : slots.some((slot) => slot.available) ? (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => (
              <button
                key={slot.startTime}
                type="button"
                disabled={!slot.available}
                onClick={() => setSelectedSlot(slot.startTime)}
                className={`rounded-full border px-3 py-3 text-sm font-semibold transition ${
                  selectedSlot === slot.startTime
                    ? "border-date bg-date text-cream"
                    : slot.available
                      ? "border-date/15 bg-white text-date hover:border-mint"
                      : "cursor-not-allowed border-date/5 bg-date/5 text-date/35"
                }`}
              >
                {slot.startTime}
              </button>
            ))}
          </div>
        ) : selectedDate ? (
          <p className="mt-3 rounded-md bg-white p-4 text-sm font-semibold text-date/65">No available tables for this date.</p>
        ) : (
          <p className="mt-3 rounded-md bg-white p-4 text-sm font-semibold text-date/65">Choose an available date to see table times.</p>
        )}
      </div>

      {selectedDate && selectedSlot ? (
        <div className="mt-5 grid gap-3">
          <p className="rounded-md bg-white p-3 text-sm font-semibold text-date/70">
            Selected: {partySize} guest{partySize === 1 ? "" : "s"} on {labelDate(selectedDate)} at {selectedSlot}. Approval is required before this booking is confirmed.
          </p>
          <input name="customerName" required placeholder="Name" className="focus-ring rounded-md border border-date/15 px-4 py-3" />
          <input name="phone" required inputMode="tel" placeholder="Phone" className="focus-ring rounded-md border border-date/15 px-4 py-3" />
          <input name="email" type="email" placeholder="Email optional" className="focus-ring rounded-md border border-date/15 px-4 py-3" />
          <textarea name="notes" placeholder="Notes" className="focus-ring min-h-24 rounded-md border border-date/15 px-4 py-3" />
          {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {message ? <p className="flex items-center gap-2 rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint"><CheckCircle2 size={17} /> {message}</p> : null}
          <button disabled={submitting} className="focus-ring rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:cursor-not-allowed disabled:bg-date/35">
            {submitting ? "Sending request..." : "Request booking"}
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-md bg-white p-4 text-sm font-semibold text-date/65">
          Contact details will appear after you choose an available date and time.
        </div>
      )}
    </form>
  );
}
