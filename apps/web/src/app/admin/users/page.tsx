import { AdminUsersManager } from "./AdminUsersManager";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminUsersPage() {
  return (
    <AdminPageShell
      eyebrow="Admin users"
      title="Manage staff access."
      description="Super Admins can create staff accounts, reset passwords, disable access, and control roles."
      breadcrumbs={[{ label: "Admin Users" }]}
      backLabel="Back to overview"
    >
      <AdminUsersManager />
    </AdminPageShell>
  );
}
