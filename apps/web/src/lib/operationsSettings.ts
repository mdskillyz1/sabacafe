import { constants as fsConstants, promises as fs } from "fs";
import path from "path";
import { businessInfo, type OperationsSettings } from "@saba/shared";
import bundledSettings from "../../data/operations-settings.json";

const settingsFileName = "operations-settings.json";
const candidateSettingsPaths = [
  path.join(process.cwd(), "data", settingsFileName),
  path.join(process.cwd(), "apps", "web", "data", settingsFileName),
  path.join("/tmp", "saba-cafe", settingsFileName)
];

export const defaultOperationsSettings = (): OperationsSettings => ({
  pickupEnabled: true,
  deliveryEnabled: true,
  deliveryRadiusMiles: 5,
  deliveryFeePerMilePence: 0,
  originPostcode: businessInfo.deliveryOriginPostcode
});

async function readFirstAvailableSettings() {
  for (const settingsPath of candidateSettingsPaths) {
    try {
      return await fs.readFile(settingsPath, "utf8");
    } catch {
      // Missing/read-only serverless data should fall back to bundled defaults.
    }
  }
  return JSON.stringify(bundledSettings);
}

async function writableSettingsPath() {
  for (const settingsPath of candidateSettingsPaths) {
    try {
      await fs.mkdir(path.dirname(settingsPath), { recursive: true });
      await fs.access(path.dirname(settingsPath), fsConstants.W_OK);
      return settingsPath;
    } catch {
      // Try the next candidate.
    }
  }
  return candidateSettingsPaths[candidateSettingsPaths.length - 1];
}

export async function readOperationsSettings(): Promise<OperationsSettings> {
  try {
    const raw = await readFirstAvailableSettings();
    const parsed = JSON.parse(raw) as Partial<OperationsSettings>;
    return {
      ...defaultOperationsSettings(),
      ...parsed,
      deliveryRadiusMiles: Number(parsed.deliveryRadiusMiles ?? 5),
      deliveryFeePerMilePence: Number(parsed.deliveryFeePerMilePence ?? 0)
    };
  } catch {
    return defaultOperationsSettings();
  }
}

export async function writeOperationsSettings(input: OperationsSettings) {
  const settings: OperationsSettings = {
    pickupEnabled: Boolean(input.pickupEnabled),
    deliveryEnabled: Boolean(input.deliveryEnabled),
    deliveryRadiusMiles: Math.max(0, Number(input.deliveryRadiusMiles) || 5),
    deliveryFeePerMilePence: Math.max(0, Math.round(Number(input.deliveryFeePerMilePence) || 0)),
    originPostcode: input.originPostcode || businessInfo.deliveryOriginPostcode
  };
  const settingsPath = await writableSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  return settings;
}
