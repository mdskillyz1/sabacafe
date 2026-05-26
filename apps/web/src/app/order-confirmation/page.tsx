import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getOrder } from "@/lib/orderStore";
import { money } from "@saba/shared";

export default async function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ order?: string; payment?: string }> }) {
  const params = await searchParams;
  const order = params.order ? await getOrder(params.order).catch(() => null) : null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <CheckCircle2 className="mx-auto text-mint" size={58} />
      <h1 className="mt-6 font-display text-5xl font-semibold text-date">Order received.</h1>
      <p className="mt-4 text-lg leading-8 text-date/70">
        {order ? (
          <>
            Order <strong>{order.orderNumber}</strong> has been sent to Saba Cafe. Status: <strong>{order.status}</strong>.
          </>
        ) : (
          <>
            Order reference: <strong>{params.order ?? "pending"}</strong>.
          </>
        )}
      </p>
      {order ? (
        <div className="mx-auto mt-6 rounded-lg border border-date/10 bg-white p-5 text-left shadow-sm">
          <p className="font-semibold text-date">{order.orderType.replace("_", "-")} {order.tableNumber ? `• Table ${order.tableNumber}` : ""}</p>
          <p className="mt-1 text-sm text-date/60">Payment: {order.paymentStatus} • Total {money(order.totalPence)} • Tracking {order.trackingCode}</p>
          {order.paymentMethod === "PAY_IN_STORE" || order.paymentStatus === "PENDING_PAYMENT" ? (
            <p className="mt-4 rounded-md bg-saffron/15 p-3 text-sm font-semibold text-date">Please pay at the counter. A staff member will prepare your food shortly.</p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/menu" className="rounded-full bg-date px-5 py-3 font-semibold text-cream">Back to menu</Link>
        <Link href="/order" className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">Order again</Link>
      </div>
    </main>
  );
}
