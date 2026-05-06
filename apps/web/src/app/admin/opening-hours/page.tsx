export default function AdminOpeningHoursPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-date p-8 text-cream">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Opening hours</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">Trading hours.</h1>
        <p className="mt-4 max-w-3xl text-cream/75">Manage public opening hours, closures, special dates, pickup windows, and booking hours.</p>
      </div>
      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Hours editor</h2>
        <p className="mt-3 leading-7 text-date/70">This section is ready for the shared opening-hours model. Booking availability is managed from the Bookings section.</p>
      </section>
    </main>
  );
}
