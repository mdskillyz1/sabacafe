import { promises as fs } from "fs";
import path from "path";
import { businessInfo, type OperationsSettings } from "@saba/shared";

const settingsPath = path.join(process.cwd(), "data", "operations-settings.json");

export const defaultOperationsSettings = (): OperationsSettings => ({
  pickupEnabled: true,
  deliveryEnabled: true,
  deliveryRadiusMiles: 5,
  deliveryFeePerMilePence: 0,
  originPostcode: businessInfo.deliveryOriginPostcode
});

async function ensureSettings() {
  try {
    await fs.access(settingsPath);
  } catch {
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(defaultOperationsSettings(), null, 2));
  }
}

export async function readOperationsSettings(): Promise<OperationsSettings> {
  await ensureSettings();
  const raw = await fs.readFile(settingsPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<OperationsSettings>;
  return {
    ...defaultOperationsSettings(),
    ...parsed,
    deliveryRadiusMiles: Number(parsed.deliveryRadiusMiles ?? 5),
    deliveryFeePerMilePence: Number(parsed.deliveryFeePerMilePence ?? 0)
  };
}

export async function writeOperationsSettings(input: OperationsSettings) {
  const settings: OperationsSettings = {
    pickupEnabled: Boolean(input.pickupEnabled),
    deliveryEnabled: Boolean(input.deliveryEnabled),
    deliveryRadiusMiles: Math.max(0, Number(input.deliveryRadiusMiles) || 5),
    deliveryFeePerMilePence: Math.max(0, Math.round(Number(input.deliveryFeePerMilePence) || 0)),
    originPostcode: input.originPostcode || businessInfo.deliveryOriginPostcode
  };
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  return settings;
}
