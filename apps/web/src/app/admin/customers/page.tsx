export default function AdminCustomersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-date p-8 text-cream">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Customers</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">Customer records.</h1>
        <p className="mt-4 max-w-3xl text-cream/75">View customer order history, bookings, contact details, loyalty, and reviews.</p>
      </div>
      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Customer overview</h2>
        <p className="mt-3 leading-7 text-date/70">Customer accounts and profiles are defined in the shared database schema and can be expanded here as orders and bookings grow.</p>
      </section>
    </main>
  );
}
