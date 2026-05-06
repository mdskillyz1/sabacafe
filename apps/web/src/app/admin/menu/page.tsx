import { AdminMenuEditor } from "./AdminMenuEditor";

export default function AdminMenuPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Menu manager</p>
      <h1 className="mt-2 font-display text-5xl font-semibold text-date">Add dishes, save drafts, then publish to customers.</h1>
      <p className="mt-4 max-w-3xl text-date/70">
        Nothing appears on the public menu until staff press Publish. Use this screen to manage names, descriptions, prices,
        images, allergens, spice levels, halal labels, availability, popular badges, size options, add-ons, and prep times.
      </p>
      <AdminMenuEditor />
    </main>
  );
}
