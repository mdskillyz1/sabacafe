import { AdminPageShell } from "../AdminPageShell";
import { OrdersAdmin } from "../orders/OrdersAdmin";

export default function KitchenPage() {
  return (
    <AdminPageShell
      eyebrow="Kitchen display"
      title="Live kitchen orders."
      description="Large order cards refresh automatically. Dine-in table numbers, collection orders, delivery orders, payment state, and item notes all share the same order system."
      breadcrumbs={[{ label: "Kitchen" }]}
      backLabel="Back to overview"
    >
      <OrdersAdmin initialOrderType="DINE_IN" kitchenMode />
    </AdminPageShell>
  );
}
