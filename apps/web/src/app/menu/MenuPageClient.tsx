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

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Saba Cafe menu</p>
        <h1 className="mt-2 font-display text-5xl font-semibold text-date">Fresh Somali favourites, ready for pickup, delivery, or a warm table in store.</h1>
        <p className="mt-4 leading-7 text-date/70">
          Our online menu is managed directly by Saba Cafe. When new dishes are published, you will see them here first for
          ordering, pickup, delivery, and dine-in visits at {businessInfo.formattedAddress}.
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
          {menu.categories.map((category) => {
            const items = menu.items.filter((item) => item.categoryId === category.id);
            if (!items.length) return null;
            return (
              <section key={category.id} id={category.slug}>
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
