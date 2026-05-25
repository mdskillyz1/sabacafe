import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Award, Clock, MapPin, ShieldCheck, Star, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/Badge";
import { FoodImage } from "@/components/FoodImage";
import { BookingWidget } from "./BookingWidget";
import { getMenu } from "@/lib/data";
import { businessInfo, googleReviewSummary, money, openingHours, type MenuItem } from "@saba/shared";

async function getFeaturedItems() {
  try {
    const menu = await getMenu();
    const items = menu.items.filter((item) => item.available && item.published && !item.hidden);
    const featured = items.filter((item) => item.popular || item.recommended);
    return (featured.length ? featured : items).slice(0, 6);
  } catch {
    return [] as MenuItem[];
  }
}

export default async function HomePage() {
  const featuredItems = await getFeaturedItems();
  const trustCards: [string, LucideIcon][] = [
    ["Halal kitchen", ShieldCheck],
    ["Fresh prep daily", UtensilsCrossed],
    ["Loyalty rewards", Award]
  ];

  return (
    <main>
      <section className="relative overflow-hidden bg-cream">
        <div className="absolute inset-0 somali-pattern opacity-35" />
        <div className="relative mx-auto grid min-h-[calc(100svh-116px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-72px)] lg:grid-cols-[1fr_0.92fr] lg:px-8">
          <div className="max-w-3xl">
            <Badge tone="green">Halal • Fresh • Family-owned • Authentic Somali food</Badge>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-date sm:text-6xl lg:text-7xl">
              Authentic Somali food.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-date/72">
              A family-owned cafe rooted in Somali hospitality, where fresh halal food, spiced tea, and familiar flavours are
              served with the warmth of home on Old Kent Road.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="focus-ring rounded-full bg-date px-5 py-3 text-center text-sm font-semibold text-cream shadow-soft sm:px-6 sm:py-4 sm:text-base" href="/order">
                Order Now
              </Link>
              <Link className="focus-ring rounded-full border border-date/20 bg-white px-5 py-3 text-center text-sm font-semibold text-date sm:px-6 sm:py-4 sm:text-base" href="/#booking">
                Book a Table
              </Link>
              <Link className="focus-ring rounded-full border border-date/20 bg-white px-5 py-3 text-center text-sm font-semibold text-date sm:px-6 sm:py-4 sm:text-base" href="/menu">
                View Menu
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-date/70">
              <span className="inline-flex items-center gap-2 font-semibold text-date">
                <Star className="fill-saffron text-saffron" size={18} /> {businessInfo.googleRating.toFixed(1)} Google rating
              </span>
              <span>{businessInfo.formattedAddress}</span>
              <span>ASAP pickup from just 15 mins</span>
            </div>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-lg bg-date shadow-soft sm:min-h-[420px] lg:min-h-[520px]">
            <Image
              src="/brand/saba-food-hero.jpeg"
              alt="Somali food platter with rice, pasta, meat, vegetables and sauce"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover object-[50%_56%]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Featured dishes</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-date">Fresh favourites from the Saba Cafe menu.</h2>
          </div>
          <Link href="/menu" className="font-semibold text-mint">
            View full menu
          </Link>
        </div>

        {featuredItems.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-date/10 bg-white shadow-sm">
                <FoodImage label={item.name} src={item.image} className="min-h-44" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-date">{item.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-date/70">{item.description}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-clay">{money(item.pricePence)}</p>
                  </div>
                  <Link href="/order" className="mt-5 inline-flex rounded-full bg-date px-5 py-3 text-sm font-semibold text-cream">
                    Order this
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-date/10 bg-white p-8 shadow-sm">
            <h3 className="font-display text-3xl font-semibold text-date">Menu is being refreshed</h3>
            <p className="mt-3 max-w-2xl leading-7 text-date/70">
              Please view the full menu or call Saba Cafe for today&apos;s freshly prepared Somali dishes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/menu" className="rounded-full bg-date px-5 py-3 font-semibold text-cream">
                View Menu
              </Link>
              <a href={businessInfo.phoneHref} className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">
                Call {businessInfo.phone}
              </a>
            </div>
          </div>
        )}
      </section>

      <section id="reviews" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Reviews</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-date">Trust before the first bite.</h2>
            <p className="mt-4 leading-7 text-date/70">
              Saba Cafe is listed on Google as a {businessInfo.category.toLowerCase()} with a {businessInfo.googleRating.toFixed(1)}
              -star rating. Read the latest customer feedback directly on Google or leave a review after your visit.
            </p>
            <a className="mt-6 inline-flex rounded-full bg-mint px-5 py-3 font-semibold text-white" href={process.env.GOOGLE_REVIEW_URL ?? businessInfo.googleReviewUrl}>
              Leave us a Google Review
            </a>
          </div>
          <div className="rounded-lg border border-date/10 bg-cream p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-date shadow-sm">
                {googleReviewSummary.rating.toFixed(1)}
              </div>
              <div>
                <div className="flex gap-1 text-saffron">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="fill-current" size={20} />
                  ))}
                </div>
                <p className="mt-2 font-semibold text-date">
                  {googleReviewSummary.rating.toFixed(1)} Google rating
                </p>
                <p className="mt-1 text-sm text-date/65">Read the latest customer reviews directly on Google.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="rounded-full bg-date px-5 py-3 font-semibold text-cream" href={businessInfo.googleMapsUrl}>
                Read on Google
              </a>
              <a className="rounded-full border border-date/15 bg-white px-5 py-3 font-semibold text-date" href={businessInfo.googleReviewUrl}>
                Leave a Review
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        {trustCards.map(([label, Icon]) => (
          <div key={String(label)} className="rounded-lg border border-date/10 bg-white p-6 shadow-sm">
            <Icon className="text-mint" size={28} />
            <h3 className="mt-4 font-display text-2xl font-semibold text-date">{String(label)}</h3>
            <p className="mt-2 text-sm leading-6 text-date/65">Built into ordering, checkout, app accounts, and admin controls.</p>
          </div>
        ))}
      </section>

      <section id="booking" className="bg-date py-16 text-cream">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Visit Saba Cafe</p>
            <h2 className="mt-2 font-display text-4xl font-semibold">Pickup, delivery, tables, and catering.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-cream/15 p-5">
                <Clock />
                <h3 className="mt-3 font-semibold">Opening hours</h3>
                <p className="mt-2 text-sm font-semibold text-saffron">{businessInfo.todayHoursLabel}</p>
                <ul className="mt-3 space-y-2 text-sm text-cream/75">
                  {openingHours.map((row) => (
                    <li key={row.day} className="flex justify-between gap-4">
                      <span>{row.day}</span>
                      <span>{row.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-cream/15 p-5">
                <MapPin />
                <h3 className="mt-3 font-semibold">Location</h3>
                <p className="mt-3 text-sm leading-6 text-cream/75">{businessInfo.formattedAddress}</p>
                <p className="mt-2 text-sm leading-6 text-cream/75">{businessInfo.phone}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-date" href={businessInfo.googleDirectionsUrl}>
                    Directions
                  </a>
                  <a className="rounded-full border border-cream/20 px-4 py-2 text-sm font-semibold text-cream" href={businessInfo.phoneHref}>
                    Call
                  </a>
                </div>
              </div>
            </div>
          </div>
          <BookingWidget />
        </div>
      </section>

    </main>
  );
}
