import { AdminPageShell } from "../AdminPageShell";

export default function AdminCustomersPage() {
  return (
    <AdminPageShell
      eyebrow="Customers"
      title="Customer records."
      description="View customer order history, bookings, contact details, loyalty, and reviews."
      breadcrumbs={[{ label: "Customers" }]}
      backLabel="Back to overview"
    >
      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Customer overview</h2>
        <p className="mt-3 leading-7 text-date/70">Customer accounts and profiles are defined in the shared database schema and can be expanded here as orders and bookings grow.</p>
      </section>
    </AdminPageShell>
  );
}
