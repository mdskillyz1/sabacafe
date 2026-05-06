import { promises as fs } from "fs";
import path from "path";
import { menuCategories, type MenuCategory, type MenuItem } from "@saba/shared";

export type MenuStore = {
  published: boolean;
  updatedAt: string;
  categories: MenuCategory[];
  items: MenuItem[];
};

const storePath = path.join(process.cwd(), "data", "menu-store.json");

const emptyStore = (): MenuStore => ({
  published: false,
  updatedAt: new Date().toISOString(),
  categories: menuCategories,
  items: []
});

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(emptyStore(), null, 2));
  }
}

export async function readMenuStore(): Promise<MenuStore> {
  await ensureStore();
  const raw = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<MenuStore>;
  return {
    published: Boolean(parsed.published),
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    categories: parsed.categories?.length ? parsed.categories : menuCategories,
    items: parsed.items ?? []
  };
}

export async function writeMenuStore(store: MenuStore) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  const cleanStore: MenuStore = {
    ...store,
    updatedAt: new Date().toISOString(),
    categories: store.categories.length ? store.categories : menuCategories,
    items: store.items.map((item) => ({
      ...item,
      pricePence: Number(item.pricePence) || 0,
      spiceLevel: Math.min(3, Math.max(0, Number(item.spiceLevel))) as 0 | 1 | 2 | 3,
      prepMinutes: Number(item.prepMinutes) || 15,
      allergens: item.allergens ?? [],
      options: item.options ?? [],
      addOns: item.addOns ?? []
    }))
  };
  await fs.writeFile(storePath, JSON.stringify(cleanStore, null, 2));
  return cleanStore;
}

export async function getPublishedMenu() {
  const store = await readMenuStore();
  return {
    categories: store.categories,
    items: store.published ? store.items.filter((item) => !item.hidden && item.available) : [],
    published: store.published,
    updatedAt: store.updatedAt
  };
}
