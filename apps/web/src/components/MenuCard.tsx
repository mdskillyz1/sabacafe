"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "./Badge";
import { FoodImage } from "./FoodImage";
import { money, optionDisplayName, optionGroup, optionLabel, requiredOptionGroups, type MenuItem, type MenuItemOption } from "@saba/shared";

export function MenuCard({
  item,
  onAdd,
  compact = false,
  quantity = 0
}: {
  item: MenuItem;
  onAdd?: (item: MenuItem, optionIds?: string[], optionLabels?: string[]) => void;
  compact?: boolean;
  quantity?: number;
}) {
  const groups = useMemo(() => requiredOptionGroups(item), [item]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const chosenOptions = groups
    .map((group) => item.options.find((option) => option.id === selectedOptions[group]))
    .filter((option): option is MenuItemOption => Boolean(option));
  const selectedOptionIds = chosenOptions.map((option) => option.id);
  const selectedOptionLabels = chosenOptions.map(optionLabel);
  const priceDelta = chosenOptions.reduce((sum, option) => sum + option.priceDeltaPence, 0);
  const displayPrice = item.pricePence + priceDelta;
  const missingRequired = groups.some((group) => !selectedOptions[group]);

  return (
    <article className={`grid w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-date/10 bg-white shadow-sm ${compact ? "" : "sm:grid-cols-[160px_1fr] lg:grid-cols-[180px_1fr]"}`}>
      <FoodImage label={item.name} src={item.image} className={compact ? "min-h-36 sm:min-h-48" : "min-h-36 sm:min-h-full"} />
      <div className={`flex min-w-0 flex-col p-4 sm:p-5 ${compact ? "min-h-0" : "min-h-0 sm:min-h-64"}`}>
        <div className="flex flex-wrap gap-2">
          {item.popular ? <Badge>Popular</Badge> : null}
          {item.recommended ? <Badge tone="dark">Chef pick</Badge> : null}
        </div>
        <div className="mt-4 flex min-w-0 items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h3 className="break-words font-display text-xl font-semibold leading-tight text-date sm:text-2xl">{item.name}</h3>
            <p className="mt-2 text-sm leading-6 text-date/70">{item.description}</p>
          </div>
          <p className="shrink-0 font-semibold text-clay">{groups.length && !onAdd ? `From ${money(item.pricePence)}` : money(displayPrice)}</p>
        </div>
        {groups.length ? (
          <div className="mt-4 space-y-3 rounded-md border border-date/10 bg-cream/70 p-3">
            {groups.map((group) => {
              const options = item.options.filter((option) => optionGroup(option) === group);
              return (
                <fieldset key={group}>
                  <legend className="text-xs font-bold uppercase tracking-[0.12em] text-clay">{group}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {options.map((option) => {
                      const active = selectedOptions[group] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedOptions((current) => ({ ...current, [group]: option.id }))}
                          className={`focus-ring min-h-10 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                            active ? "border-mint bg-mint text-white" : "border-date/10 bg-white text-date hover:border-mint/40"
                          }`}
                        >
                          {optionDisplayName(option)}
                          {option.priceDeltaPence ? <span className="ml-1 opacity-80">+{money(option.priceDeltaPence)}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
        ) : null}
        {item.spiceLevel ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-date/55">
            <span>Spice {item.spiceLevel}/3</span>
          </div>
        ) : null}
        {onAdd ? (
          <button
            type="button"
            disabled={!item.available || missingRequired}
            onClick={() => onAdd(item, selectedOptionIds, selectedOptionLabels)}
            className={`focus-ring mt-auto w-full rounded-full px-4 py-3 text-center text-sm font-semibold text-cream transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-date/30 ${
              quantity > 0 ? "bg-mint" : "bg-date"
            }`}
          >
            {!item.available ? "Unavailable" : missingRequired ? "Choose options first" : quantity > 0 ? `Added x${quantity}` : "Add to basket"}
          </button>
        ) : (
          <Link
            href="/order"
            className={`focus-ring mt-auto w-full rounded-full px-4 py-3 text-center text-sm font-semibold ${
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
