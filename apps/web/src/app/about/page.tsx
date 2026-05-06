import { businessInfo } from "@saba/shared";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">About Saba Cafe</p>
      <h1 className="mt-2 font-display text-5xl font-semibold text-date">A warm modern Somali cafe for everyday meals and family gatherings.</h1>
      <p className="mt-6 text-lg leading-8 text-date/70">
        Saba Cafe brings Somali hospitality into a digital-first restaurant experience: beautiful food, fast ordering,
        halal ingredients, loyalty, catering, table booking, and review-led trust from {businessInfo.formattedAddress}.
      </p>
    </main>
  );
}
