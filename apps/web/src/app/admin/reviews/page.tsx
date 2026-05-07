import { AdminPageShell } from "../AdminPageShell";

export default function AdminReviewsPage() {
  return (
    <AdminPageShell
      eyebrow="Reviews"
      title="Review management."
      description="Approve, hide, respond to customer reviews, and manage Google review settings."
      breadcrumbs={[{ label: "Reviews" }]}
      backLabel="Back to overview"
    >
      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Review workflow</h2>
        <p className="mt-3 leading-7 text-date/70">Customer reviews after completed orders or visits will appear here for staff approval before showing publicly.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {["Pending approval", "Approved reviews", "Hidden reviews"].map((label) => (
            <div key={label} className="rounded-md bg-cream p-4 font-semibold text-date">{label}</div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
