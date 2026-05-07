import { AdminBookingsManager } from "./AdminBookingsManager";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminBookingsPage() {
  return (
    <AdminPageShell
      eyebrow="Bookings"
      title="Tables, slots, and guest requests."
      description="Manage table capacity, opening rules, blocked dates, special hours, and every customer booking request."
      breadcrumbs={[{ label: "Bookings" }]}
      backLabel="Back to overview"
    >
      <AdminBookingsManager />
    </AdminPageShell>
  );
}
