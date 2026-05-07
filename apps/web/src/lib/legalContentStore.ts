import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import bundledLegalContent from "../../data/legal-content.json";
import type { LegalContentStore, LegalPageContent, LegalPageSlug } from "@saba/shared";

const storeFileName = "legal-content.json";
const candidateStorePaths = [
  path.join(process.cwd(), "data", storeFileName),
  path.join(process.cwd(), "apps", "web", "data", storeFileName),
  path.join("/tmp", "saba-cafe", storeFileName)
];

export const legalNavigation: { title: string; href: string; slug?: LegalPageSlug }[] = [
  { title: "Terms & Conditions", href: "/terms-and-conditions", slug: "terms-and-conditions" },
  { title: "Privacy Policy", href: "/privacy-policy", slug: "privacy-policy" },
  { title: "Cookie Policy", href: "/cookie-policy", slug: "cookie-policy" },
  { title: "Refund Policy", href: "/refund-policy", slug: "refund-policy" },
  { title: "Delivery Policy", href: "/delivery-policy", slug: "delivery-policy" },
  { title: "Accessibility Statement", href: "/accessibility", slug: "accessibility" },
  { title: "Contact Us", href: "/contact" }
];

async function readFirstAvailableStore() {
  for (const storePath of candidateStorePaths) {
    try {
      return await fs.readFile(storePath, "utf8");
    } catch {
      // Keep legal pages available even when serverless storage is read-only.
    }
  }
  return JSON.stringify(bundledLegalContent);
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

function normalizePage(page: LegalPageContent): LegalPageContent {
  return {
    slug: page.slug,
    title: page.title?.trim() || page.slug,
    summary: page.summary?.trim() || "",
    lastUpdated: page.lastUpdated || new Date().toISOString().slice(0, 10),
    sections: (page.sections ?? []).map((section) => ({
      heading: section.heading?.trim() || "Information",
      body: section.body?.trim() || ""
    }))
  };
}

export async function readLegalContent(): Promise<LegalContentStore> {
  try {
    const parsed = JSON.parse(await readFirstAvailableStore()) as LegalContentStore;
    return {
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      pages: parsed.pages.map(normalizePage)
    };
  } catch {
    return bundledLegalContent as LegalContentStore;
  }
}

export async function readLegalPage(slug: LegalPageSlug) {
  const store = await readLegalContent();
  return store.pages.find((page) => page.slug === slug);
}

export async function writeLegalContent(input: LegalContentStore) {
  const next: LegalContentStore = {
    updatedAt: new Date().toISOString(),
    pages: input.pages.map(normalizePage)
  };
  const storePath = await writableStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}
