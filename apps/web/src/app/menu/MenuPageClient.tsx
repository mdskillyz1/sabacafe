"use client";

import { useEffect, useState } from "react";
import { MenuCard } from "@/components/MenuCard";
import { businessInfo, type MenuCategory, type MenuItem } from "@saba/shared";

type PublishedMenu = {
  categories: MenuCategory[];
  items: MenuItem[];
  published: boolean;
};

export function MenuPageClient() {
  const [menu, setMenu] = useState<PublishedMenu>({ categories: [], items: [], published: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/menu", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setMenu(data))
      .finally(() => setLoading(false));
  }, []);

  const hasMenu = menu.published && menu.items.length > 0;
  const visibleCategories = menu.categories.filter((category) => menu.items.some((item) => item.categoryId === category.id));

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Saba Cafe menu</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-date sm:text-5xl">Fresh Somali favourites, ready for pickup, delivery, or a warm table in store.</h1>
        <p className="mt-4 leading-7 text-date/70">
          Our online menu is managed directly by Saba Cafe. When new dishes are published, you will see them here first for
          ordering, pickup, delivery, and dine-in visits at {businessInfo.formattedAddress}.
        </p>
        <p className="mt-4 inline-flex rounded-full bg-mint/10 px-4 py-2 text-sm font-semibold text-mint">
          100% halal Somali food, prepared fresh by Saba Cafe.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/order" className="rounded-full bg-date px-5 py-3 font-semibold text-cream">Order Now</a>
          <a href={businessInfo.googleDirectionsUrl} className="rounded-full border border-date/15 bg-white px-5 py-3 font-semibold text-date">
            Get Directions
          </a>
          <a href={businessInfo.phoneHref} className="rounded-full border border-date/15 bg-white px-5 py-3 font-semibold text-date">
            Call {businessInfo.phone}
          </a>
        </div>
      </div>

      {loading ? (
        <section className="mt-10 rounded-lg border border-date/10 bg-white p-8 shadow-sm" aria-live="polite">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Loading menu</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-date">Preparing today&apos;s Saba Cafe menu.</h2>
            <p className="mt-4 leading-7 text-date/70">Fresh dishes are loading now. This usually takes just a moment.</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid overflow-hidden rounded-lg border border-date/10 bg-white shadow-sm sm:grid-cols-[180px_1fr]">
                <div className="min-h-48 animate-pulse bg-cream" />
                <div className="space-y-4 p-5">
                  <div className="h-7 w-2/3 animate-pulse rounded-full bg-cream" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-cream" />
                  <div className="h-4 w-3/4 animate-pulse rounded-full bg-cream" />
                  <div className="h-10 w-36 animate-pulse rounded-full bg-cream" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !hasMenu ? (
        <section className="mt-10 rounded-lg border border-date/10 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Menu not available</p>
          <h2 className="mt-2 font-display text-4xl font-semibold text-date">The online menu is being prepared.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-date/70">
            Please call us on {businessInfo.phone} or visit {businessInfo.formattedAddress}. The Saba Cafe team can publish
            dishes from the admin menu manager as soon as they are ready.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a href={businessInfo.phoneHref} className="rounded-full bg-mint px-5 py-3 font-semibold text-white">Call Saba Cafe</a>
            <a href={businessInfo.googleDirectionsUrl} className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">Directions</a>
          </div>
        </section>
      ) : null}

      {hasMenu ? (
        <div className="mt-10 space-y-12">
          <nav aria-label="Menu categories" className="sticky top-[106px] z-40 -mx-4 border-y border-date/10 bg-cream/95 px-4 py-3 shadow-sm backdrop-blur sm:top-[73px] sm:mx-0 sm:rounded-lg sm:border sm:bg-white/95">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-clay sm:hidden">Choose category</p>
            <div className="flex snap-x gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {visibleCategories.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.slug}`}
                  className="focus-ring min-h-11 shrink-0 snap-start rounded-full border border-date/10 bg-white px-4 py-2.5 text-sm font-semibold text-date shadow-sm transition hover:border-mint hover:text-mint"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </nav>

          {visibleCategories.map((category) => {
            const items = menu.items.filter((item) => item.categoryId === category.id);
            return (
              <section key={category.id} id={category.slug} className="scroll-mt-40 sm:scroll-mt-32">
                <h2 className="font-display text-3xl font-semibold text-date">{category.name}</h2>
                <p className="mt-2 text-date/65">{category.description}</p>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {items.map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
