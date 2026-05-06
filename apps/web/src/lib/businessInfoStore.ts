import { promises as fs } from "fs";
import path from "path";
import { defaultBusinessInfoSettings, type BusinessInfoSettings } from "@saba/shared";

const storePath = path.join(process.cwd(), "data", "business-info.json");

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
    socialLinks: {
      instagram: cleanOptionalUrl(input.socialLinks?.instagram),
      tiktok: cleanOptionalUrl(input.socialLinks?.tiktok)
    }
  };
}

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(defaultBusinessInfoSettings, null, 2));
  }
}

export async function readBusinessInfo(): Promise<BusinessInfoSettings> {
  await ensureStore();
  const raw = await fs.readFile(storePath, "utf8");
  return normalizeBusinessInfo(JSON.parse(raw) as Partial<BusinessInfoSettings>);
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
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(normalized, null, 2));
  return { ok: true as const, data: normalized };
}
