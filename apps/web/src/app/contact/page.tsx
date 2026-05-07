import Link from "next/link";
import { businessInfo, openingHours } from "@saba/shared";
import { readBusinessInfo } from "@/lib/businessInfoStore";

export const metadata = {
  title: "Contact Saba Cafe | Old Kent Road London",
  description: "Contact Saba Cafe for Somali food, pickup, delivery, table bookings, catering, and restaurant information."
};

export default async function ContactPage() {
  const info = await readBusinessInfo();

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-date">Contact and location</h1>
      <p className="mt-4 text-date/70">
        Visit Saba Cafe at {info.address}. We are listed on Google as a {businessInfo.category.toLowerCase()} with a{" "}
        {businessInfo.googleRating.toFixed(1)} rating.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-date/10 bg-white p-6">
          <h2 className="font-display text-3xl font-semibold text-date">Pickup, delivery, and tables</h2>
          <p className="mt-3 text-date/65">{info.openingHoursText}. Call {info.phone} or order online for pickup and delivery.</p>
          <div className="mt-4 space-y-2 text-sm text-date/70">
            <p>{info.address}</p>
            <p><a className="font-semibold text-mint" href={`mailto:${info.email}`}>{info.email}</a></p>
            <p><a className="font-semibold text-mint" href={`tel:${info.phone.replace(/[^\d+]/g, "")}`}>{info.phone}</a></p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/order" className="rounded-full bg-mint px-5 py-3 font-semibold text-white">Order now</Link>
            <a href={businessInfo.googleDirectionsUrl} className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">Directions</a>
            <a href={`tel:${info.phone.replace(/[^\d+]/g, "")}`} className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">Call</a>
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

      <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-3xl font-semibold text-date">Send a message</h2>
        <p className="mt-3 max-w-2xl text-date/65">For catering, booking questions, order support, accessibility requests, or general enquiries, send the team a message.</p>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder="Name" />
          <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder="Phone or email" />
          <textarea className="focus-ring min-h-36 rounded-md border border-date/15 px-4 py-3 md:col-span-2" placeholder="How can we help?" />
          <button type="button" className="focus-ring rounded-full bg-date px-5 py-3 font-semibold text-cream md:w-fit">
            Send enquiry
          </button>
        </form>
      </section>
    </main>
  );
}
