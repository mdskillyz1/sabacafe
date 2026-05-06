import Link from "next/link";

export default function OffersPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-date">Offers</h1>
      <div className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">First order</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-date">Use SABA10 for 10% off.</h2>
        <p className="mt-3 text-date/65">Promo code logic, loyalty points, referrals, and analytics events are ready for expansion.</p>
        <Link href="/order" className="mt-5 inline-flex rounded-full bg-mint px-5 py-3 font-semibold text-white">Redeem offer</Link>
      </div>
    </main>
  );
}
