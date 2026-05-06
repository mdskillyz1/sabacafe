import { OrdersAdmin } from "./OrdersAdmin";

export default function AdminOrdersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Live orders</p>
      <h1 className="mt-2 font-display text-5xl font-semibold text-date">Update order status in real time.</h1>
      <p className="mt-4 max-w-3xl text-date/70">This connects to the same shared order API used by the customer website. Production auth should restrict this route to STAFF, MANAGER, and ADMIN roles.</p>
      <OrdersAdmin />
    </main>
  );
}
