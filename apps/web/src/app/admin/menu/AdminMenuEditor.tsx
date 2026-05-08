"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { ImageIcon, Plus, Save, Send, Trash2, UploadCloud, X } from "lucide-react";
import { menuCategories, money, type AddOn, type MenuCategory, type MenuItem, type MenuItemOption } from "@saba/shared";
import { MenuCard } from "@/components/MenuCard";

type MenuStore = {
  published: boolean;
  updatedAt: string;
  categories: MenuCategory[];
  items: MenuItem[];
  setup?: {
    databaseConfigured: boolean;
    saveEnabled: boolean;
    message: string | null;
  };
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
  published: false,
  hidden: false,
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

const gbpFormatter = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const priceToInput = (pence: number) => gbpFormatter.format(Math.max(0, Number(pence) || 0) / 100);

const inputToPence = (value: string) => {
  const normalized = value.replace(/[£,\s]/g, "");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
};

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

function ImageUploadField({
  image,
  uploading,
  onUpload,
  onRemove,
  onUrlChange
}: {
  image: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onUrlChange: (image: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) {
      compressMenuImage(file)
        .then(onUpload)
        .catch(() => onUpload(file));
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="text-sm font-semibold text-date/70">
      Dish image
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-1 grid gap-4 rounded-lg border border-dashed p-4 transition md:grid-cols-[180px_1fr] ${
          dragging ? "border-mint bg-mint/10" : "border-date/20 bg-cream/70"
        }`}
      >
        <div className="relative min-h-36 overflow-hidden rounded-md bg-white">
          {image ? (
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-36 flex-col items-center justify-center gap-2 text-date/40">
              <ImageIcon size={28} />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3">
          <div>
            <p className="font-semibold text-date">Drop a dish photo here</p>
            <p className="mt-1 text-xs font-normal leading-5 text-date/55">JPG, PNG, or WebP. Maximum 5MB. Large photos are resized in your browser before upload.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-date px-4 py-2 text-sm font-semibold text-cream">
              <UploadCloud size={16} />
              {uploading ? "Uploading..." : image ? "Replace image" : "Choose image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => handleFiles(event.target.files)}
              />
            </label>
            {image ? (
              <button
                type="button"
                onClick={onRemove}
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-date/15 px-4 py-2 text-sm font-semibold text-date"
              >
                <X size={16} /> Remove
              </button>
            ) : null}
          </div>
          <label className="text-xs font-semibold text-date/55">
            Or paste image URL
            <input
              value={image.startsWith("data:") ? "" : image}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://..."
              className="focus-ring mt-1 w-full rounded-md border border-date/15 bg-white px-3 py-3 font-normal text-date"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function PriceInput({ value, onChange }: { value: number; onChange: (pence: number) => void }) {
  const [displayValue, setDisplayValue] = useState(priceToInput(value));

  useEffect(() => {
    setDisplayValue(priceToInput(value));
  }, [value]);

  return (
    <input
      inputMode="decimal"
      value={displayValue}
      onChange={(event) => {
        const next = event.target.value.replace(/[^0-9£.,\s]/g, "");
        setDisplayValue(next);
        onChange(inputToPence(next));
      }}
      onBlur={() => setDisplayValue(priceToInput(value))}
      className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal"
    />
  );
}

async function compressMenuImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  if (typeof window === "undefined") return file;

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });
    const maxSide = 1600;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.round(image.width * ratio);
    const height = Math.round(image.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function AdminMenuEditor() {
  const [store, setStore] = useState<MenuStore>({ published: false, updatedAt: "", categories: menuCategories, items: [] });
  const [selectedItemId, setSelectedItemId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingItemId, setUploadingItemId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/menu", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Menu could not be loaded.");
      setStore(data);
      setSelectedItemId((current) => current || data.items[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Menu could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateItem(id: string, patch: Partial<MenuItem>) {
    setMessage("");
    setError("");
    setSelectedItemId(id);
    setStore((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, published: patch.published ?? false, ...patch } : item
      )
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
    setError("");
    const payload: MenuStore = {
      ...store,
      published,
      items: store.items.map((item) => ({
        ...item,
        slug: item.slug || slugify(item.name),
        image: item.image || "",
        published: published ? true : item.published === true
      }))
    };
    try {
      const response = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error ?? "Menu could not be saved.");
      setStore(saved);
      setSelectedItemId((current) => current || saved.items[0]?.id || "");
      setMessage(published ? "Menu published to customers." : "Draft saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Menu could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(itemId: string, file: File) {
    setUploadingItemId(itemId);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/admin/menu/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Image could not be uploaded.");
      updateItem(itemId, { image: data.imageUrl });
      setMessage("Image added. Save draft or publish to keep this change.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image could not be uploaded.");
    } finally {
      setUploadingItemId("");
    }
  }

  const publishedCount = store.items.filter((item) => item.published && !item.hidden).length;
  const draftCount = store.items.filter((item) => !item.published).length;
  const saveDisabled = saving || store.setup?.saveEnabled === false;

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-date/10 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-date">{store.published ? "Published" : "Draft only"}</p>
          <p className="text-sm text-date/60">
            {store.items.length} item{store.items.length === 1 ? "" : "s"} in admin menu · {publishedCount} published · {draftCount} draft
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addItem} className="focus-ring inline-flex items-center gap-2 rounded-full border border-date/15 px-4 py-3 font-semibold text-date">
            <Plus size={17} /> Add item
          </button>
          <button type="button" onClick={() => save(false)} disabled={saveDisabled} className="focus-ring inline-flex items-center gap-2 rounded-full bg-date px-4 py-3 font-semibold text-cream disabled:opacity-60">
            <Save size={17} /> Save draft
          </button>
          <button type="button" onClick={() => save(true)} disabled={saveDisabled || !store.items.length} className="focus-ring inline-flex items-center gap-2 rounded-full bg-mint px-4 py-3 font-semibold text-white disabled:opacity-60">
            <Send size={17} /> Publish
          </button>
        </div>
      </div>

      {store.setup?.message ? (
        <div className="rounded-md bg-saffron/15 p-4 text-sm font-semibold text-clay">
          <p>{store.setup.message}</p>
          <p className="mt-2 font-normal text-date/70">
            To enable real menu saving, add `DATABASE_URL` in Vercel, run `./tools/pnpm db:push`, then redeploy.
          </p>
        </div>
      ) : null}
      {message ? <p className="rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint">{message}</p> : null}
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {loading ? <p className="rounded-md bg-white p-4 text-sm font-semibold text-date/70 shadow-sm">Loading menu items...</p> : null}

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
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className={`rounded-full px-3 py-1 ${item.published ? "bg-mint/10 text-mint" : "bg-saffron/15 text-clay"}`}>
                      {item.published ? "Published" : "Draft"}
                    </span>
                    {item.hidden ? <span className="rounded-full bg-date/10 px-3 py-1 text-date/60">Hidden</span> : null}
                    {!item.available ? <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">Unavailable</span> : null}
                  </div>
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
                  <PriceInput value={item.pricePence} onChange={(pricePence) => updateItem(item.id, { pricePence })} />
                </label>
                <div className="md:col-span-2">
                  <ImageUploadField
                    image={item.image}
                    uploading={uploadingItemId === item.id}
                    onUpload={(file) => uploadImage(item.id, file)}
                    onRemove={() => updateItem(item.id, { image: "" })}
                    onUrlChange={(image) => updateItem(item.id, { image })}
                  />
                </div>
                <label className="text-sm font-semibold text-date/70">
                  Allergens
                  <input value={listToText(item.allergens)} onChange={(event) => updateItem(item.id, { allergens: textToList(event.target.value) })} placeholder="gluten, milk, nuts" className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-date/70">
                  Spice level
                  <select value={item.spiceLevel} onChange={(event) => updateItem(item.id, { spiceLevel: Number(event.target.value) as 0 | 1 | 2 | 3 })} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-3 py-3 font-normal">
                    <option value={0}>Not applicable</option>
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
