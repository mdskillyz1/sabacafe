import { OrdersAdmin } from "./OrdersAdmin";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminOrdersPage() {
  return (
    <AdminPageShell
      eyebrow="Live orders"
      title="Orders"
      description="Manage table orders, payment state, and kitchen progress from one clear screen."
      breadcrumbs={[{ label: "Orders" }]}
      backLabel="Back to overview"
    >
      <OrdersAdmin />
    </AdminPageShell>
  );
}
