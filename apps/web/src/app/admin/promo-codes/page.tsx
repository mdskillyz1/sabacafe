import { AdminPageShell } from "../AdminPageShell";

export default function AdminPromoCodesPage() {
  return (
    <AdminPageShell
      eyebrow="Promo codes"
      title="Offers and campaigns."
      description="Create first-order discounts, seasonal codes, minimum-spend offers, and referral campaigns."
      breadcrumbs={[{ label: "Promo Codes" }]}
      backLabel="Back to overview"
    >
      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Promotion workflow</h2>
        <p className="mt-3 leading-7 text-date/70">Promo code storage exists in the database schema. This admin screen is the web-first control surface for campaign setup.</p>
      </section>
    </AdminPageShell>
  );
}
