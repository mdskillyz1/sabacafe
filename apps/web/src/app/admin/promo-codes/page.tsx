export default function AdminPromoCodesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-date p-8 text-cream">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Promo codes</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">Offers and campaigns.</h1>
        <p className="mt-4 max-w-3xl text-cream/75">Create first-order discounts, seasonal codes, minimum-spend offers, and referral campaigns.</p>
      </div>
      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Promotion workflow</h2>
        <p className="mt-3 leading-7 text-date/70">Promo code storage exists in the database schema. This admin screen is the web-first control surface for campaign setup.</p>
      </section>
    </main>
  );
}
