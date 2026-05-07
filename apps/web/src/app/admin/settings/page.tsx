import { AdminOperationsSettings } from "./AdminOperationsSettings";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminSettingsPage() {
  return (
    <AdminPageShell
      eyebrow="Operations settings"
      title="Control pickup, delivery, radius, and fees."
      description="Delivery is limited by distance from Saba Cafe. Customers cannot place delivery orders outside the active radius. The delivery fee per mile is set here by staff."
      breadcrumbs={[{ label: "Settings" }]}
      backLabel="Back to overview"
      maxWidthClassName="max-w-5xl"
    >
      <AdminOperationsSettings />
    </AdminPageShell>
  );
}
