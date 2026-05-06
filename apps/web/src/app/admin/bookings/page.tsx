import { AdminBookingsManager } from "./AdminBookingsManager";

export default function AdminBookingsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-date p-8 text-cream">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Bookings</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">Tables, slots, and guest requests.</h1>
        <p className="mt-4 max-w-3xl text-cream/75">
          Manage table capacity, opening rules, blocked dates, special hours, and every customer booking request.
        </p>
      </div>
      <AdminBookingsManager />
    </main>
  );
}
