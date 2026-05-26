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
  pickupEnabled: false,
  deliveryEnabled: false,
  dineInEnabled: true,
  stripeEnabled: false,
  payInStoreEnabled: true,
  cashOnCollectionEnabled: false,
  cashOnDeliveryEnabled: false,
  enableOnlinePayments: false,
  enableDelivery: false,
  enableCollection: false,
  enableDineInQR: true,
  deliveryRadiusMiles: 5,
  deliveryFeePerMilePence: 0,
  originPostcode: businessInfo.deliveryOriginPostcode,
  minimumOrderPence: 1200,
  prepTimeMinutes: 15
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
      pickupEnabled: Boolean(parsed.enableCollection ?? parsed.pickupEnabled ?? false),
      deliveryEnabled: Boolean(parsed.enableDelivery ?? parsed.deliveryEnabled ?? false),
      dineInEnabled: (parsed.enableDineInQR ?? parsed.dineInEnabled) !== false,
      stripeEnabled: Boolean(parsed.enableOnlinePayments ?? parsed.stripeEnabled ?? false),
      deliveryRadiusMiles: Number(parsed.deliveryRadiusMiles ?? 5),
      deliveryFeePerMilePence: Number(parsed.deliveryFeePerMilePence ?? 0),
      minimumOrderPence: Number(parsed.minimumOrderPence ?? 1200),
      prepTimeMinutes: Number(parsed.prepTimeMinutes ?? 15)
    };
  } catch {
    return defaultOperationsSettings();
  }
}

export async function writeOperationsSettings(input: OperationsSettings) {
  const settings: OperationsSettings = {
    pickupEnabled: Boolean(input.pickupEnabled),
    deliveryEnabled: Boolean(input.deliveryEnabled),
    dineInEnabled: input.dineInEnabled !== false,
    stripeEnabled: input.stripeEnabled !== false,
    payInStoreEnabled: input.payInStoreEnabled !== false,
    cashOnCollectionEnabled: input.cashOnCollectionEnabled !== false,
    cashOnDeliveryEnabled: input.cashOnDeliveryEnabled === true,
    deliveryRadiusMiles: Math.max(0, Number(input.deliveryRadiusMiles) || 5),
    deliveryFeePerMilePence: Math.max(0, Math.round(Number(input.deliveryFeePerMilePence) || 0)),
    originPostcode: input.originPostcode || businessInfo.deliveryOriginPostcode,
    minimumOrderPence: Math.max(0, Math.round(Number(input.minimumOrderPence) || 1200)),
    prepTimeMinutes: Math.max(0, Math.round(Number(input.prepTimeMinutes) || 15))
  };
  settings.enableOnlinePayments = settings.stripeEnabled;
  settings.enableDelivery = settings.deliveryEnabled;
  settings.enableCollection = settings.pickupEnabled;
  settings.enableDineInQR = settings.dineInEnabled;
  const settingsPath = await writableSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  return settings;
}
