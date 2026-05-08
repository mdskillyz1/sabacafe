import { constants as fsConstants, promises as fs } from "fs";
import path from "path";
import { menuCategories, type MenuCategory, type MenuItem } from "@saba/shared";
import { prisma } from "@saba/database";
import bundledMenuStore from "../../data/menu-store.json";

export type MenuStore = {
  published: boolean;
  updatedAt: string;
  categories: MenuCategory[];
  items: MenuItem[];
};

export class MenuDatabaseSetupError extends Error {
  code: "DATABASE_URL_MISSING" | "DATABASE_SCHEMA_MISMATCH" | "DATABASE_CONNECTION_FAILED";

  constructor(code: MenuDatabaseSetupError["code"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MenuDatabaseSetupError";
    this.code = code;
  }
}

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

const db = prisma as any;

function databaseMenuEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function menuDatabaseConfigured() {
  return databaseMenuEnabled();
}

export function describeMenuDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const prismaCode = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";

  if (error instanceof MenuDatabaseSetupError) {
    return {
      code: error.code,
      message: error.message,
      detail: process.env.NODE_ENV === "production" ? undefined : error.cause instanceof Error ? error.cause.message : undefined
    };
  }

  if (prismaCode === "P2022" || /published|column|does not exist/i.test(message)) {
    return {
      code: "DATABASE_SCHEMA_MISMATCH",
      message: "The menu database schema is not up to date. Run ./tools/pnpm db:push, then redeploy.",
      detail: process.env.NODE_ENV === "production" ? undefined : message
    };
  }

  if (/Can't reach database|connect|ECONNREFUSED|ENOTFOUND|DATABASE_URL/i.test(message)) {
    return {
      code: "DATABASE_CONNECTION_FAILED",
      message: "The menu database cannot be reached. Check DATABASE_URL in Vercel and try again.",
      detail: process.env.NODE_ENV === "production" ? undefined : message
    };
  }

  return {
    code: "MENU_SAVE_FAILED",
    message: "Menu could not be saved. Please check the database setup and try again.",
    detail: process.env.NODE_ENV === "production" ? undefined : message
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeItem(item: MenuItem, index: number): MenuItem {
  const name = item.name.trim() || "New menu item";
  const baseSlug = slugify(item.slug || name) || `menu-item-${index + 1}`;

  return {
    ...item,
    id: item.id || `menu-${crypto.randomUUID()}`,
    name,
    slug: baseSlug,
    description: item.description.trim(),
    pricePence: Math.max(0, Number(item.pricePence) || 0),
    image: item.image || "",
    allergens: item.allergens ?? [],
    spiceLevel: Math.min(3, Math.max(0, Number(item.spiceLevel ?? 0))) as 0 | 1 | 2 | 3,
    halal: item.halal !== false,
    available: item.available !== false,
    published: item.published === true,
    hidden: item.hidden === true,
    popular: item.popular === true,
    recommended: item.recommended === true,
    prepMinutes: Math.max(0, Number(item.prepMinutes) || 15),
    options: item.options ?? [],
    addOns: item.addOns ?? []
  };
}

function normalizeItems(items: MenuItem[], publishAll = false) {
  const usedSlugs = new Map<string, number>();

  return items.map((item, index) => {
    const normalized = normalizeItem({ ...item, published: publishAll ? true : item.published }, index);
    const count = usedSlugs.get(normalized.slug) ?? 0;
    usedSlugs.set(normalized.slug, count + 1);
    return {
      ...normalized,
      slug: count ? `${normalized.slug}-${count + 1}` : normalized.slug
    };
  });
}

function dbCategoryToMenuCategory(category: any): MenuCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    sortOrder: category.sortOrder ?? 0
  };
}

function dbItemToMenuItem(item: any): MenuItem {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    slug: item.slug,
    description: item.description ?? "",
    pricePence: item.pricePence ?? 0,
    image: item.image ?? "",
    allergens: item.allergens ?? [],
    spiceLevel: Math.min(3, Math.max(0, Number(item.spiceLevel))) as 0 | 1 | 2 | 3,
    halal: item.halal !== false,
    available: item.available !== false,
    published: item.published === true,
    hidden: item.hidden === true,
    popular: item.popular === true,
    recommended: item.recommended === true,
    prepMinutes: item.prepMinutes ?? 15,
    options: (item.options ?? []).map((option: any) => ({
      id: option.id,
      name: option.name,
      priceDeltaPence: option.priceDeltaPence ?? 0
    })),
    addOns: (item.addOns ?? []).map((addOn: any) => ({
      id: addOn.id,
      name: addOn.name,
      pricePence: addOn.pricePence ?? 0
    }))
  };
}

async function ensureDefaultCategories() {
  await Promise.all(
    menuCategories.map((category) =>
      db.menuCategory.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder
        },
        create: category
      })
    )
  );
}

async function readDatabaseMenuStore(): Promise<MenuStore> {
  await ensureDefaultCategories();
  const [categories, items] = await Promise.all([
    db.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.menuItem.findMany({
      include: {
        options: true,
        addOns: true
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    })
  ]);

  return {
    published: items.some((item: any) => item.published === true),
    updatedAt: new Date().toISOString(),
    categories: categories.map(dbCategoryToMenuCategory),
    items: items.map(dbItemToMenuItem)
  };
}

async function writeDatabaseMenuStore(store: MenuStore) {
  await ensureDefaultCategories();
  const items = normalizeItems(store.items, store.published);
  const itemIds = items.map((item) => item.id);

  await db.$transaction(async (tx: any) => {
    await tx.menuItem.deleteMany({
      where: {
        id: {
          notIn: itemIds
        }
      }
    });

    for (const [index, item] of items.entries()) {
      await tx.menuCategory.upsert({
        where: { id: item.categoryId },
        update: {},
        create: menuCategories.find((category) => category.id === item.categoryId) ?? {
          id: item.categoryId,
          name: item.categoryId,
          slug: slugify(item.categoryId),
          description: "",
          sortOrder: index
        }
      });

      await tx.menuItem.upsert({
        where: { id: item.id },
        update: {
          categoryId: item.categoryId,
          name: item.name,
          slug: item.slug,
          description: item.description,
          pricePence: item.pricePence,
          image: item.image,
          allergens: item.allergens,
          spiceLevel: item.spiceLevel,
          halal: item.halal,
          available: item.available,
          published: item.published === true,
          hidden: item.hidden === true,
          popular: item.popular,
          recommended: item.recommended,
          prepMinutes: item.prepMinutes,
          sortOrder: index,
          options: {
            deleteMany: {},
            create: item.options.map((option) => ({
              name: option.name,
              priceDeltaPence: option.priceDeltaPence
            }))
          },
          addOns: {
            deleteMany: {},
            create: item.addOns.map((addOn) => ({
              name: addOn.name,
              pricePence: addOn.pricePence
            }))
          }
        },
        create: {
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          slug: item.slug,
          description: item.description,
          pricePence: item.pricePence,
          image: item.image,
          allergens: item.allergens,
          spiceLevel: item.spiceLevel,
          halal: item.halal,
          available: item.available,
          published: item.published === true,
          hidden: item.hidden === true,
          popular: item.popular,
          recommended: item.recommended,
          prepMinutes: item.prepMinutes,
          sortOrder: index,
          options: {
            create: item.options.map((option) => ({
              name: option.name,
              priceDeltaPence: option.priceDeltaPence
            }))
          },
          addOns: {
            create: item.addOns.map((addOn) => ({
              name: addOn.name,
              pricePence: addOn.pricePence
            }))
          }
        }
      });
    }
  });

  return readDatabaseMenuStore();
}

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
  if (databaseMenuEnabled()) {
    try {
      return await readDatabaseMenuStore();
    } catch (error) {
      console.error("Database menu read failed.", error);
      const description = describeMenuDatabaseError(error);
      throw new MenuDatabaseSetupError(description.code as MenuDatabaseSetupError["code"], description.message, {
        cause: error instanceof Error ? error : undefined
      });
    }
  }

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
  if (!databaseMenuEnabled()) {
    throw new MenuDatabaseSetupError(
      "DATABASE_URL_MISSING",
      "Menu saving needs a PostgreSQL database. Add DATABASE_URL in Vercel, run ./tools/pnpm db:push, then redeploy."
    );
  }

  if (databaseMenuEnabled()) {
    try {
      return await writeDatabaseMenuStore(store);
    } catch (error) {
      console.error("Database menu write failed.", error);
      const description = describeMenuDatabaseError(error);
      throw new MenuDatabaseSetupError(description.code as MenuDatabaseSetupError["code"], description.message, {
        cause: error instanceof Error ? error : undefined
      });
    }
  }

  const storePath = await writableStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  const cleanStore: MenuStore = {
    ...store,
    updatedAt: new Date().toISOString(),
    categories: store.categories.length ? store.categories : menuCategories,
    items: normalizeItems(store.items, store.published)
  };
  await fs.writeFile(storePath, JSON.stringify(cleanStore, null, 2));
  return cleanStore;
}

export async function getPublishedMenu() {
  const store = await readMenuStore();
  return {
    categories: store.categories,
    items: store.items.filter((item) => item.published && !item.hidden && item.available),
    published: store.items.some((item) => item.published),
    updatedAt: store.updatedAt
  };
}
