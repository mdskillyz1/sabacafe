"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { menuCategories, money, type AddOn, type MenuCategory, type MenuItem, type MenuItemOption } from "@saba/shared";
import { MenuCard } from "@/components/MenuCard";

type MenuStore = {
  published: boolean;
  updatedAt: string;
  categories: MenuCategory[];
  items: MenuItem[];
};

const blankItem = (): MenuItem => ({
  id: crypto.randomUUID(),
  categoryId: "starters",
  name: "",
  slug: "",
  description: "",
  pricePence: 0,
  image: "",
  allergens: [],
  spiceLevel: 0,
  halal: true,
  available: true,
  popular: false,
  recommended: false,
  prepMinutes: 15,
  options: [],
  addOns: []
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const listToText = (values: string[]) => values.join(", ");
const textToList = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const optionsToText = (rows: MenuItemOption[]) =>
  rows.map((row) => `${row.name}|${(Number(row.priceDeltaPence) / 100).toFixed(2)}`).join("\n");

const addOnsToText = (rows: AddOn[]) =>
  rows.map((row) => `${row.name}|${(Number(row.pricePence) / 100).toFixed(2)}`).join("\n");

const textToOptions = (value: string): MenuItemOption[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, price = "0"] = line.split("|");
      return { id: slugify(name), name: name.trim(), priceDeltaPence: Math.round(Number(price) * 100) };
    });

const textToAddOns = (value: string): AddOn[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, price = "0"] = line.split("|");
      return { id: slugify(name), name: name.trim(), pricePence: Math.round(Number(price) * 100) };
    });

export function AdminMenuEditor() {
  const [store, setStore] = useState<MenuStore>({ published: false, updatedAt: "", categories: menuCategories, items: [] });
  const [selectedItemId, setSelectedItemId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/menu", { cache: "no-store" });
    const data = await response.json();
    setStore(data);
    setSelectedItemId((current) => current || data.items[0]?.id || "");
  }

  useEffect(() => {
    load();
  }, []);

  function updateItem(id: string, patch: Partial<MenuItem>) {
    setSelectedItemId(id);
    setStore((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    }));
  }

  function addItem() {
    const item = blankItem();
    setSelectedItemId(item.id);
    setStore((current) => ({ ...current, items: [item, ...current.items] }));
  }

  function deleteItem(id: string) {
    setStore((current) => {
      const nextItems = current.items.filter((candidate) => candidate.id !== id);
      setSelectedItemId((selected) => (selected === id ? nextItems[0]?.id || "" : selected));
      return { ...current, items: nextItems };
    });
  }

  const selectedItem = useMemo(
    () => store.items.find((item) => item.id === selectedItemId) || store.items[0],
    [selectedItemId, store.items]
  );

  const previewItem = selectedItem
    ? {
        ...selectedItem,
        name: selectedItem.name || "New menu item",
        description: selectedItem.description || "A short, tempting description will appear here for customers.",
        image: selectedItem.image || "/images/menu-placeholder.jpg",
        prepMinutes: selectedItem.prepMinutes || 15
      }
    : null;

  async function save(published = store.published) {
    setSaving(true);
    setMessage("");
    const payload: MenuStore = {
      ...store,
      published,
      items: store.items.map((item) => ({
        ...item,
        slug: item.slug || slugify(item.name),
        image: item.image || "/images/menu-placeholder.jpg"
      }))
    };
    const response = await fetch("/api/admin/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const saved = await response.json();
    setStore(saved);
    setSaving(false);
    setMessage(published ? "Menu published to customers." : "Draft saved.");
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-date/10 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-date">{store.published ? "Published" : "Draft only"}</p>
          <p className="text-sm text-date/60">{store.items.length} item{store.items.length === 1 ? "" : "s"} in admin menu</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addItem} className="focus-ring inline-flex items-center gap-2 rounded-full border border-date/15 px-4 py-3 font-semibold text-date">
            <Plus size={17} /> Add item
          </button>
          <button type="button" onClick={() => save(false)} disabled={saving} className="focus-ring inline-flex items-center gap-2 rounded-full bg-date px-4 py-3 font-semibold text-cream disabled:opacity-60">
            <Save size={17} /> Save draft
          </button>
          <button type="button" onClick={() => save(true)} disabled={saving || !store.items.length} className="focus-ring inline-flex items-center gap-2 rounded-full bg-mint px-4 py-3 font-semibold text-white disabled:opacity-60">
            <Send size={17} /> Publish
          </button>
        </div>
      </div>

      {message ? <p className="rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint">{message}</p> : null}

      {!store.items.length ? (
        <div className="rounded-lg border border-date/10 bg-cream p-8 text-center">
          <h2 className="font-display text-3xl font-semibold text-date">No menu items added yet.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-date/70">Customers will see “Menu not available” until staff add real dishes and publish them.</p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          {store.items.map((item) => (
            <article
              key={item.id}
              onFocus={() => setSelectedItemId(item.id)}
              onClick={() => setSelectedItemId(item.id)}
              className={`rounded-lg border bg-white p-5 shadow-sm transition ${
                selectedItem?.id === item.id ? "border-clay shadow-md ring-2 ring-clay/15" : "border-date/10"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl font-semibold text-date">{item.name || "New menu item"}</h2>
                  <p className="mt-1 text-sm text-date/60">{item.pricePence ? money(item.pricePence) : "Price not set"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="focus-ring inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-date/70">
                  Name
                  <input value={item.name} onChange={(event) => updateItem(item.id, { name: event.target.value, slug: slugify(event.target.value) })} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-date/70">
                  Category
                  <select value={item.categoryId} onChange={(event) => updateItem(item.id, { categoryId: event.target.value })} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal">
                    {store.categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-date/70 md:col-span-2">
                  Description
                  <textarea value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} className="focus-ring mt-1 min-h-24 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-date/70">
                  Price
                  <input type="number" step="0.01" value={(item.pricePence / 100).toString()} onChange={(event) => updateItem(item.id, { pricePence: Math.round(Number(event.target.value) * 100) })} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-date/70">
                  Image URL
                  <input value={item.image} onChange={(event) => updateItem(item.id, { image: event.target.value })} placeholder="/images/dish.jpg" className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-date/70">
                  Allergens
                  <input value={listToText(item.allergens)} onChange={(event) => updateItem(item.id, { allergens: textToList(event.target.value) })} placeholder="gluten, milk, nuts" className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-date/70">
                  Spice level
                  <select value={item.spiceLevel} onChange={(event) => updateItem(item.id, { spiceLevel: Number(event.target.value) as 0 | 1 | 2 | 3 })} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal">
                    <option value={0}>0 - No spice</option>
                    <option value={1}>1 - Mild</option>
                    <option value={2}>2 - Medium</option>
                    <option value={3}>3 - Hot</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-date/70">
                  Prep minutes
                  <input type="number" value={item.prepMinutes} onChange={(event) => updateItem(item.id, { prepMinutes: Number(event.target.value) })} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-date/70 md:col-span-2">
                  Size options, one per line: name|price difference
                  <textarea value={optionsToText(item.options)} onChange={(event) => updateItem(item.id, { options: textToOptions(event.target.value) })} placeholder={"Regular|0\nLarge|3.50"} className="focus-ring mt-1 min-h-24 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-date/70 md:col-span-2">
                  Add-ons, one per line: name|price
                  <textarea value={addOnsToText(item.addOns)} onChange={(event) => updateItem(item.id, { addOns: textToAddOns(event.target.value) })} placeholder={"Extra sauce|0.75\nSalad|1.50"} className="focus-ring mt-1 min-h-24 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["Halal", "halal"],
                  ["Available", "available"],
                  ["Popular badge", "popular"],
                  ["Recommended badge", "recommended"],
                  ["Hide item", "hidden"]
                ].map(([label, key]) => (
                  <label key={key} className="flex items-center gap-2 rounded-md border border-date/10 px-3 py-3 text-sm font-semibold text-date/70">
                    <input
                      type="checkbox"
                      checked={Boolean(item[key as keyof MenuItem])}
                      onChange={(event) => updateItem(item.id, { [key]: event.target.checked } as Partial<MenuItem>)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-lg border border-date/10 bg-cream p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">Preview screen</p>
                <h2 className="font-display text-3xl font-semibold text-date">Customer view</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-date/70">
                {store.published ? "Live menu" : "Draft"}
              </span>
            </div>

            {previewItem ? (
              <div className="space-y-4">
                <MenuCard item={previewItem} onAdd={() => undefined} compact />
                <div className="rounded-md bg-white p-4 text-sm leading-6 text-date/70">
                  <p className="font-semibold text-date">This is how customers will see the selected item.</p>
                  <p className="mt-1">
                    {selectedItem?.hidden
                      ? "Hidden items stay out of the public menu."
                      : selectedItem?.available
                        ? "Available items can be ordered once the menu is published."
                        : "Unavailable items appear disabled for customers."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-white p-6 text-center text-sm leading-6 text-date/70">
                Add or select a menu item to preview it here.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
