"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "./Badge";
import { FoodImage } from "./FoodImage";
import { itemAvailabilityMessage, isItemOrderableToday, money, optionDisplayName, optionGroup, optionLabel, requiredOptionGroups, type MenuItem, type MenuItemOption } from "@saba/shared";

const platterConfigs = {
  "saba-special-plateau": {
    mainRequired: 1,
    extraRequired: 2,
    sideRequired: 3
  },
  "bigger-plateau": {
    mainRequired: 2,
    extraRequired: 3,
    sideRequired: 5
  }
} as const;

type PlatterId = keyof typeof platterConfigs;

function isPlatterItem(item: MenuItem): item is MenuItem & { id: PlatterId } {
  return item.id === "saba-special-plateau" || item.id === "bigger-plateau";
}

function buildOptionIds(item: MenuItem, quantities: Record<string, number>) {
  return Object.entries(quantities).flatMap(([id, count]) => Array.from({ length: count }, () => id)).filter(Boolean);
}

function buildOptionLabels(item: MenuItem, quantities: Record<string, number>) {
  return Object.entries(quantities)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => {
      const option = item.options.find((candidate) => candidate.id === id);
      if (!option) return "";
      const group = optionGroup(option);
      const display = optionDisplayName(option);
      return `${group}: ${display}${count > 1 ? ` x${count}` : ""}`;
    })
    .filter(Boolean);
}

function CounterButton({ label, value, onMinus, onPlus, disableMinus, disablePlus }: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  disableMinus?: boolean;
  disablePlus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-date/10 bg-white px-3 py-2">
      <span className="text-sm font-semibold text-date">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={disableMinus || value <= 0} onClick={onMinus} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-date/15 text-date disabled:opacity-35">-</button>
        <span className="w-6 text-center text-sm font-bold text-date">{value}</span>
        <button type="button" disabled={disablePlus} onClick={onPlus} className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-date/15 text-date disabled:opacity-35">+</button>
      </div>
    </div>
  );
}

export function MenuCard({
  item,
  onAdd,
  lockedActionLabel,
  onLockedAction,
  compact = false,
  quantity = 0
}: {
  item: MenuItem;
  onAdd?: (item: MenuItem, optionIds?: string[], optionLabels?: string[], notes?: string) => void;
  lockedActionLabel?: string;
  onLockedAction?: () => void;
  compact?: boolean;
  quantity?: number;
}) {
  const groups = useMemo(() => requiredOptionGroups(item), [item]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [platterQuantities, setPlatterQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const platterConfig = isPlatterItem(item) ? platterConfigs[item.id] : null;
  const chosenOptions = groups
    .map((group) => item.options.find((option) => option.id === selectedOptions[group]))
    .filter((option): option is MenuItemOption => Boolean(option));
  const selectedOptionIds = platterConfig ? buildOptionIds(item, platterQuantities) : chosenOptions.map((option) => option.id);
  const selectedOptionLabels = platterConfig ? buildOptionLabels(item, platterQuantities) : chosenOptions.map(optionLabel);
  const platterChosenOptions = platterConfig
    ? selectedOptionIds.map((optionId) => item.options.find((option) => option.id === optionId)).filter((option): option is MenuItemOption => Boolean(option))
    : [];
  const priceDelta = (platterConfig ? platterChosenOptions : chosenOptions).reduce((sum, option) => sum + option.priceDeltaPence, 0);
  const displayPrice = item.pricePence + priceDelta;
  const mainTotal = item.options.filter((option) => optionGroup(option) === "Main Meat").reduce((sum, option) => sum + (platterQuantities[option.id] ?? 0), 0);
  const extraTotal = item.options.filter((option) => optionGroup(option) === "Extra Meat").reduce((sum, option) => sum + (platterQuantities[option.id] ?? 0), 0);
  const sideTotal = item.options.filter((option) => optionGroup(option) === "Sides").reduce((sum, option) => sum + (platterQuantities[option.id] ?? 0), 0);
  const missingRequired = platterConfig
    ? mainTotal !== platterConfig.mainRequired || extraTotal !== platterConfig.extraRequired || sideTotal !== platterConfig.sideRequired
    : groups.some((group) => !selectedOptions[group]);
  const orderableToday = isItemOrderableToday(item);
  const unavailableMessage = itemAvailabilityMessage(item);
  const groupedOptions = useMemo(
    () => ({
      main: item.options.filter((option) => optionGroup(option) === "Main Meat"),
      extra: item.options.filter((option) => optionGroup(option) === "Extra Meat"),
      sides: item.options.filter((option) => optionGroup(option) === "Sides")
    }),
    [item.options]
  );

  function setPlatterCount(id: string, nextValue: number) {
    setPlatterQuantities((current) => ({ ...current, [id]: Math.max(0, nextValue) }));
  }

  function singleChoice(id: string, optionIds: string[]) {
    setPlatterQuantities((current) => {
      const next = { ...current };
      optionIds.forEach((optionId) => {
        next[optionId] = optionId === id ? 1 : 0;
      });
      return next;
    });
  }

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
          <p className="shrink-0 font-semibold text-clay">{money(displayPrice)}</p>
        </div>
        {platterConfig && onAdd ? (
          <div className="mt-4 space-y-4 rounded-md border border-date/10 bg-cream/70 p-3">
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-[0.12em] text-clay">
                Main Meat {mainTotal}/{platterConfig.mainRequired}
              </legend>
              {item.id === "saba-special-plateau" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {groupedOptions.main.map((option) => {
                    const active = (platterQuantities[option.id] ?? 0) > 0;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => singleChoice(option.id, groupedOptions.main.map((candidate) => candidate.id))}
                        className={`focus-ring min-h-10 rounded-full border px-3 py-2 text-sm font-semibold transition ${active ? "border-mint bg-mint text-white" : "border-date/10 bg-white text-date"}`}
                      >
                        {optionDisplayName(option)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2 grid gap-2">
                  {groupedOptions.main.map((option) => {
                    const value = platterQuantities[option.id] ?? 0;
                    return (
                      <CounterButton
                        key={option.id}
                        label={optionDisplayName(option)}
                        value={value}
                        disablePlus={mainTotal >= platterConfig.mainRequired}
                        onMinus={() => setPlatterCount(option.id, value - 1)}
                        onPlus={() => setPlatterCount(option.id, value + 1)}
                      />
                    );
                  })}
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-[0.12em] text-clay">
                Extra Meat {extraTotal}/{platterConfig.extraRequired}
              </legend>
              <div className="mt-2 grid gap-2">
                {groupedOptions.extra.map((option) => {
                  const value = platterQuantities[option.id] ?? 0;
                  return (
                    <CounterButton
                      key={option.id}
                      label={optionDisplayName(option)}
                      value={value}
                      disablePlus={extraTotal >= platterConfig.extraRequired}
                      onMinus={() => setPlatterCount(option.id, value - 1)}
                      onPlus={() => setPlatterCount(option.id, value + 1)}
                    />
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-[0.12em] text-clay">
                Sides {sideTotal}/{platterConfig.sideRequired}
              </legend>
              <div className="mt-2 grid gap-2">
                {groupedOptions.sides.map((option) => {
                  const value = platterQuantities[option.id] ?? 0;
                  return (
                    <CounterButton
                      key={option.id}
                      label={optionDisplayName(option)}
                      value={value}
                      disablePlus={sideTotal >= platterConfig.sideRequired}
                      onMinus={() => setPlatterCount(option.id, value - 1)}
                      onPlus={() => setPlatterCount(option.id, value + 1)}
                    />
                  );
                })}
              </div>
            </fieldset>

            <div className="rounded-md bg-white p-3 text-sm text-date/70">
              <p className="font-semibold text-date">Selection summary</p>
              {selectedOptionLabels.length ? (
                <ul className="mt-2 space-y-1">
                  {selectedOptionLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">Choose your meats and sides to continue.</p>
              )}
            </div>
          </div>
        ) : groups.length ? (
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
        {onLockedAction ? (
          <div className="mt-auto space-y-3 pt-4">
            <button
              type="button"
              onClick={onLockedAction}
              disabled={!orderableToday}
              className="focus-ring w-full rounded-full bg-date px-4 py-3 text-center text-sm font-semibold text-cream transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-date/30"
            >
              {orderableToday ? lockedActionLabel ?? "Scan Table QR to Order" : unavailableMessage}
            </button>
            <p className="text-center text-xs leading-5 text-date/55">
              Table ordering unlocks after scanning the QR code inside Saba Cafe.
            </p>
          </div>
        ) : onAdd ? (
          <div className="mt-auto space-y-3 pt-4">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-date/45">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Any notes for the kitchen?"
                className="focus-ring mt-2 min-h-20 w-full resize-y rounded-md border border-date/10 bg-cream/60 px-3 py-2 text-sm font-normal normal-case tracking-normal text-date placeholder:text-date/40"
              />
            </label>
            <button
              type="button"
              disabled={!orderableToday || missingRequired}
              onClick={() => onAdd(item, selectedOptionIds, selectedOptionLabels, notes.trim())}
              className={`focus-ring w-full rounded-full px-4 py-3 text-center text-sm font-semibold text-cream transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-date/30 ${
                quantity > 0 ? "bg-mint" : "bg-date"
              }`}
            >
              {!orderableToday ? unavailableMessage : missingRequired ? "Choose options first" : quantity > 0 ? `Added x${quantity}` : "Add to basket"}
            </button>
          </div>
        ) : (
          <Link
            href="/order"
            className={`focus-ring mt-auto w-full rounded-full px-4 py-3 text-center text-sm font-semibold ${
              orderableToday ? "bg-date text-cream" : "pointer-events-none bg-date/30 text-cream"
            }`}
          >
            {orderableToday ? "Scan Table QR to Order" : unavailableMessage}
          </Link>
        )}
      </div>
    </article>
  );
}
