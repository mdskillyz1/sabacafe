import { AdminOperationsSettings } from "./AdminOperationsSettings";

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Operations settings</p>
      <h1 className="mt-2 font-display text-5xl font-semibold text-date">Control pickup, delivery, radius, and fees.</h1>
      <p className="mt-4 max-w-3xl text-date/70">
        Delivery is limited by distance from Saba Cafe. Customers cannot place delivery orders outside the active radius.
        The delivery fee per mile is set here by staff.
      </p>
      <AdminOperationsSettings />
    </main>
  );
}
