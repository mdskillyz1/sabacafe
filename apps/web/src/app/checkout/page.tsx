import Link from "next/link";

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-date">Checkout</h1>
      <p className="mt-4 text-lg leading-8 text-date/70">
        Checkout is integrated into the order page for fewer steps: cart, pickup or delivery, validation, promo code,
        VAT, delivery fee, and Stripe payment are handled in one focused flow.
      </p>
      <Link href="/order" className="mt-8 inline-flex rounded-full bg-date px-5 py-3 font-semibold text-cream">
        Continue to ordering
      </Link>
    </main>
  );
}
