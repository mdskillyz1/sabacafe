import { AdminPageShell } from "../AdminPageShell";
import { StaffTableDashboard } from "./StaffTableDashboard";

export default function AdminTablesPage() {
  return (
    <AdminPageShell
      eyebrow="Table ordering"
      title="Take orders by table."
      description="Staff can select a table, search the live menu, add notes, send orders to the kitchen, mark counter payment, and clear tables."
      breadcrumbs={[{ label: "Tables" }]}
    >
      <StaffTableDashboard />
    </AdminPageShell>
  );
}
