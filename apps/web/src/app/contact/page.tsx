import Link from "next/link";
import { businessInfo, openingHours } from "@saba/shared";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-date">Contact and location</h1>
      <p className="mt-4 text-date/70">
        Visit Saba Cafe at {businessInfo.formattedAddress}. We are listed on Google as a {businessInfo.category.toLowerCase()} with a{" "}
        {businessInfo.googleRating.toFixed(1)} rating.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-date/10 bg-white p-6">
          <h2 className="font-display text-3xl font-semibold text-date">Pickup, delivery, and tables</h2>
          <p className="mt-3 text-date/65">{businessInfo.todayHoursLabel}. Call {businessInfo.phone} or order online for pickup and delivery.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/order" className="rounded-full bg-mint px-5 py-3 font-semibold text-white">Order now</Link>
            <a href={businessInfo.googleDirectionsUrl} className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">Directions</a>
            <a href={businessInfo.phoneHref} className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">Call</a>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-date/65">
            {openingHours.map((row) => (
              <li key={row.day} className="flex justify-between gap-4">
                <span>{row.day}</span>
                <span>{row.hours}</span>
              </li>
            ))}
          </ul>
        </div>
        <iframe
          title="Saba Cafe map"
          src={process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ?? businessInfo.mapsEmbedUrl}
          className="min-h-96 w-full rounded-lg border border-date/10"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </main>
  );
}
