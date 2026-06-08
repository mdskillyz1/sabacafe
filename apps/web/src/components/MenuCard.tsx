"use client";

import Link from "next/link";
import { Badge } from "./Badge";
import { FoodImage } from "./FoodImage";
import { money, type MenuItem } from "@saba/shared";

export function MenuCard({
  item,
  onAdd,
  compact = false,
  quantity = 0
}: {
  item: MenuItem;
  onAdd?: (item: MenuItem) => void;
  compact?: boolean;
  quantity?: number;
}) {
  return (
    <article className={`grid overflow-hidden rounded-lg border border-date/10 bg-white shadow-sm ${compact ? "" : "sm:grid-cols-[180px_1fr]"}`}>
      <FoodImage label={item.name} src={item.image} className={compact ? "min-h-48" : "min-h-48 sm:min-h-full"} />
      <div className={`flex flex-col p-5 ${compact ? "min-h-0" : "min-h-64"}`}>
        <div className="flex flex-wrap gap-2">
          {item.popular ? <Badge>Popular</Badge> : null}
          {item.recommended ? <Badge tone="dark">Chef pick</Badge> : null}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold text-date">{item.name}</h3>
            <p className="mt-2 text-sm leading-6 text-date/70">{item.description}</p>
          </div>
          <p className="shrink-0 font-semibold text-clay">{money(item.pricePence)}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-date/55">
          {item.spiceLevel ? <span>Spice {item.spiceLevel}/3</span> : null}
          <span>{item.prepMinutes} min</span>
          <span>{item.allergens.length ? `Allergens: ${item.allergens.join(", ")}` : "No listed allergens"}</span>
        </div>
        {onAdd ? (
          <button
            type="button"
            disabled={!item.available}
            onClick={() => onAdd(item)}
            className={`focus-ring mt-auto rounded-full px-4 py-3 text-sm font-semibold text-cream transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-date/30 ${
              quantity > 0 ? "bg-mint" : "bg-date"
            }`}
          >
            {item.available ? (quantity > 0 ? `Added x${quantity}` : "Add to basket") : "Unavailable"}
          </button>
        ) : (
          <Link
            href="/order"
            className={`focus-ring mt-auto rounded-full px-4 py-3 text-center text-sm font-semibold ${
              item.available ? "bg-date text-cream" : "pointer-events-none bg-date/30 text-cream"
            }`}
          >
            {item.available ? "Order this" : "Unavailable"}
          </Link>
        )}
      </div>
    </article>
  );
}
