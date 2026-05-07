import { OrdersAdmin } from "./OrdersAdmin";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminOrdersPage() {
  return (
    <AdminPageShell
      eyebrow="Live orders"
      title="Update order status in real time."
      description="This connects to the same shared order API used by the customer website. Staff can manage order progress while payment status remains separate."
      breadcrumbs={[{ label: "Orders" }]}
      backLabel="Back to overview"
    >
      <OrdersAdmin />
    </AdminPageShell>
  );
}
