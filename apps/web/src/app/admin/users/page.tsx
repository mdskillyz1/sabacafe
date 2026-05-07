import { AdminUsersManager } from "./AdminUsersManager";

export default function AdminUsersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Admin users</p>
      <h1 className="mt-2 font-display text-5xl font-semibold text-date">Manage staff access.</h1>
      <p className="mt-4 max-w-3xl text-date/70">
        Super Admins can create staff accounts, reset passwords, disable access, and control roles.
      </p>
      <AdminUsersManager />
    </main>
  );
}
