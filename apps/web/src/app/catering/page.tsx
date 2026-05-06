import Link from "next/link";

export default function CateringPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Catering and private events</p>
      <h1 className="mt-2 font-display text-5xl font-semibold text-date">Somali catering trays for offices, weddings, and family events.</h1>
      <p className="mt-4 max-w-3xl text-date/70">Catering trays live in the same editable menu system, with longer prep times, scheduled ordering, and admin visibility.</p>
      <Link href="/order#mains" className="mt-8 inline-flex rounded-full bg-date px-5 py-3 font-semibold text-cream">Order catering trays</Link>
    </main>
  );
}
