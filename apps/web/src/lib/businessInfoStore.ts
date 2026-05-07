import { constants as fsConstants, promises as fs } from "fs";
import path from "path";
import { defaultBusinessInfoSettings, type BusinessInfoSettings } from "@saba/shared";
import bundledBusinessInfo from "../../data/business-info.json";

const storeFileName = "business-info.json";
const candidateStorePaths = [
  path.join(process.cwd(), "data", storeFileName),
  path.join(process.cwd(), "apps", "web", "data", storeFileName),
  path.join("/tmp", "saba-cafe", storeFileName)
];

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function cleanOptionalUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function validateBusinessInfo(input: BusinessInfoSettings) {
  const errors: Record<string, string> = {};
  const email = input.email.trim();
  const phone = input.phone.trim();

  if (!input.businessName.trim()) errors.businessName = "Business name is required.";
  if (!input.copyrightText.trim()) errors.copyrightText = "Copyright text is required.";
  if (!input.address.trim()) errors.address = "Address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!/^[+()\d\s-]{7,30}$/.test(phone)) errors.phone = "Enter a valid phone number.";

  for (const [key, value] of Object.entries(input.socialLinks ?? {})) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors[key] = "Use a valid https:// social link.";
      }
    } catch {
      errors[key] = "Use a valid https:// social link.";
    }
  }

  return errors;
}

export function normalizeBusinessInfo(input: Partial<BusinessInfoSettings>): BusinessInfoSettings {
  return {
    businessName: cleanString(input.businessName, defaultBusinessInfoSettings.businessName),
    copyrightText: cleanString(input.copyrightText, defaultBusinessInfoSettings.copyrightText),
    address: cleanString(input.address, defaultBusinessInfoSettings.address),
    email: cleanString(input.email, defaultBusinessInfoSettings.email).toLowerCase(),
    phone: cleanString(input.phone, defaultBusinessInfoSettings.phone),
    openingHoursText: cleanString(input.openingHoursText, defaultBusinessInfoSettings.openingHoursText),
    cookieBannerText: cleanString(input.cookieBannerText, defaultBusinessInfoSettings.cookieBannerText),
    socialLinks: {
      instagram: cleanOptionalUrl(input.socialLinks?.instagram),
      tiktok: cleanOptionalUrl(input.socialLinks?.tiktok)
    }
  };
}

async function readFirstAvailableStore() {
  for (const storePath of candidateStorePaths) {
    try {
      return await fs.readFile(storePath, "utf8");
    } catch {
      // Vercel serverless paths can be read-only or absent. The homepage must still render.
    }
  }
  return JSON.stringify(bundledBusinessInfo);
}

async function writableStorePath() {
  for (const storePath of candidateStorePaths) {
    try {
      await fs.mkdir(path.dirname(storePath), { recursive: true });
      await fs.access(path.dirname(storePath), fsConstants.W_OK);
      return storePath;
    } catch {
      // Try the next candidate, ending with /tmp for serverless-safe demo writes.
    }
  }
  return candidateStorePaths[candidateStorePaths.length - 1];
}

export async function readBusinessInfo(): Promise<BusinessInfoSettings> {
  try {
    const raw = await readFirstAvailableStore();
    return normalizeBusinessInfo(JSON.parse(raw) as Partial<BusinessInfoSettings>);
  } catch {
    return normalizeBusinessInfo(defaultBusinessInfoSettings);
  }
}

export async function writeBusinessInfo(input: BusinessInfoSettings) {
  const candidate: BusinessInfoSettings = {
    ...defaultBusinessInfoSettings,
    ...input,
    socialLinks: {
      ...defaultBusinessInfoSettings.socialLinks,
      ...(input.socialLinks ?? {})
    }
  };
  const errors = validateBusinessInfo(candidate);
  if (Object.keys(errors).length) {
    return { ok: false as const, errors, data: candidate };
  }
  const normalized = normalizeBusinessInfo(candidate);
  const storePath = await writableStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(normalized, null, 2));
  return { ok: true as const, data: normalized };
}
