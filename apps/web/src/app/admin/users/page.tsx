import { AdminUsersManager } from "./AdminUsersManager";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminUsersPage() {
  return (
    <AdminPageShell
      eyebrow="Staff management"
      title="Invite and manage staff."
      description="Owners can invite staff by email, assign roles, disable accounts, reset passwords, and review access for restaurant operations."
      breadcrumbs={[{ label: "Staff" }]}
      backLabel="Back to overview"
    >
      <AdminUsersManager />
    </AdminPageShell>
  );
}
