export default function AdminReviewsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-date p-8 text-cream">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Reviews</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">Review management.</h1>
        <p className="mt-4 max-w-3xl text-cream/75">Approve, hide, respond to customer reviews, and manage Google review settings.</p>
      </div>
      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Review workflow</h2>
        <p className="mt-3 leading-7 text-date/70">Customer reviews after completed orders or visits will appear here for staff approval before showing publicly.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {["Pending approval", "Approved reviews", "Hidden reviews"].map((label) => (
            <div key={label} className="rounded-md bg-cream p-4 font-semibold text-date">{label}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
