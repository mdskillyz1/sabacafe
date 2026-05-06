import { AdminBusinessInfoSettings } from "./AdminBusinessInfoSettings";

export default function AdminWebsiteSettingsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-date p-8 text-cream">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Website settings</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">Business info and footer controls.</h1>
        <p className="mt-4 max-w-3xl text-cream/75">Manage the contact details, copyright, opening hours text, and social links shown to customers.</p>
      </div>
      <AdminBusinessInfoSettings />
    </main>
  );
}
