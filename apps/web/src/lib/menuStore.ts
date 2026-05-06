import { constants as fsConstants, promises as fs } from "fs";
import path from "path";
import { menuCategories, type MenuCategory, type MenuItem } from "@saba/shared";
import bundledMenuStore from "../../data/menu-store.json";

export type MenuStore = {
  published: boolean;
  updatedAt: string;
  categories: MenuCategory[];
  items: MenuItem[];
};

const storeFileName = "menu-store.json";
const candidateStorePaths = [
  path.join(process.cwd(), "data", storeFileName),
  path.join(process.cwd(), "apps", "web", "data", storeFileName),
  path.join("/tmp", "saba-cafe", storeFileName)
];

const emptyStore = (): MenuStore => ({
  published: false,
  updatedAt: new Date().toISOString(),
  categories: menuCategories,
  items: []
});

async function readFirstAvailableStore() {
  for (const storePath of candidateStorePaths) {
    try {
      return await fs.readFile(storePath, "utf8");
    } catch {
      // Keep public menu pages safe on read-only serverless hosts.
    }
  }
  return JSON.stringify(bundledMenuStore);
}

async function writableStorePath() {
  for (const storePath of candidateStorePaths) {
    try {
      await fs.mkdir(path.dirname(storePath), { recursive: true });
      await fs.access(path.dirname(storePath), fsConstants.W_OK);
      return storePath;
    } catch {
      // Try the next candidate.
    }
  }
  return candidateStorePaths[candidateStorePaths.length - 1];
}

export async function readMenuStore(): Promise<MenuStore> {
  try {
    const raw = await readFirstAvailableStore();
    const parsed = JSON.parse(raw) as Partial<MenuStore>;
    return {
      published: Boolean(parsed.published),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      categories: parsed.categories?.length ? parsed.categories : menuCategories,
      items: parsed.items ?? []
    };
  } catch {
    return emptyStore();
  }
}

export async function writeMenuStore(store: MenuStore) {
  const storePath = await writableStorePath();
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
