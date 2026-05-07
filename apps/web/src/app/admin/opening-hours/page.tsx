import { AdminPageShell } from "../AdminPageShell";

export default function AdminOpeningHoursPage() {
  return (
    <AdminPageShell
      eyebrow="Opening hours"
      title="Trading hours."
      description="Manage public opening hours, closures, special dates, pickup windows, and booking hours."
      breadcrumbs={[{ label: "Opening Hours" }]}
      backLabel="Back to overview"
    >
      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Hours editor</h2>
        <p className="mt-3 leading-7 text-date/70">This section is ready for the shared opening-hours model. Booking availability is managed from the Bookings section.</p>
      </section>
    </AdminPageShell>
  );
}
