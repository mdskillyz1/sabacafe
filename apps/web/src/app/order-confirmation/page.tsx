import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ order?: string; payment?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <CheckCircle2 className="mx-auto text-mint" size={58} />
      <h1 className="mt-6 font-display text-5xl font-semibold text-date">Order received.</h1>
      <p className="mt-4 text-lg leading-8 text-date/70">
        Your payment mode is <strong>{params.payment ?? "pending"}</strong>. Order reference: <strong>{params.order ?? "demo"}</strong>.
        Staff can now update status from the admin dashboard.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/admin/orders" className="rounded-full bg-date px-5 py-3 font-semibold text-cream">View admin orders</Link>
        <Link href="/order" className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">Order again</Link>
      </div>
    </main>
  );
}
