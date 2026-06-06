import { constants as fsConstants, promises as fs } from "fs";
import path from "path";
import { prisma } from "@saba/database";
import { businessInfo, type OperationsSettings } from "@saba/shared";
import bundledSettings from "../../data/operations-settings.json";

const db = prisma as any;

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

function normalizeSettings(input: Partial<OperationsSettings>): OperationsSettings {
  const settings: OperationsSettings = {
    ...defaultOperationsSettings(),
    ...input,
    pickupEnabled: Boolean(input.enableCollection ?? input.pickupEnabled ?? false),
    deliveryEnabled: Boolean(input.enableDelivery ?? input.deliveryEnabled ?? false),
    dineInEnabled: (input.enableDineInQR ?? input.dineInEnabled) !== false,
    stripeEnabled: Boolean(input.enableOnlinePayments ?? input.stripeEnabled ?? false),
    payInStoreEnabled: input.payInStoreEnabled !== false,
    cashOnCollectionEnabled: input.cashOnCollectionEnabled !== false,
    cashOnDeliveryEnabled: input.cashOnDeliveryEnabled === true,
    deliveryRadiusMiles: Number(input.deliveryRadiusMiles ?? 5),
    deliveryFeePerMilePence: Math.max(0, Math.round(Number(input.deliveryFeePerMilePence) || 0)),
    originPostcode: input.originPostcode || businessInfo.deliveryOriginPostcode,
    minimumOrderPence: Math.max(0, Math.round(Number(input.minimumOrderPence) || 1200)),
    prepTimeMinutes: Math.max(0, Math.round(Number(input.prepTimeMinutes) || 15))
  };
  settings.enableOnlinePayments = settings.stripeEnabled;
  settings.enableDelivery = settings.deliveryEnabled;
  settings.enableCollection = settings.pickupEnabled;
  settings.enableDineInQR = settings.dineInEnabled;
  return settings;
}

async function ensureAppSettingsSchema() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppSettings" (
      "id" TEXT PRIMARY KEY DEFAULT 'global',
      "restaurantName" TEXT NOT NULL DEFAULT 'Saba Cafe',
      "businessName" TEXT NOT NULL DEFAULT 'Saba Cafe',
      "pickupEnabled" BOOLEAN NOT NULL DEFAULT false,
      "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
      "dineInEnabled" BOOLEAN NOT NULL DEFAULT true,
      "stripeEnabled" BOOLEAN NOT NULL DEFAULT false,
      "payInStoreEnabled" BOOLEAN NOT NULL DEFAULT true,
      "cashOnCollectionEnabled" BOOLEAN NOT NULL DEFAULT false,
      "cashOnDeliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
      "deliveryRadiusMiles" DOUBLE PRECISION NOT NULL DEFAULT 5,
      "deliveryFeePerMilePence" INTEGER NOT NULL DEFAULT 0,
      "minimumOrderPence" INTEGER NOT NULL DEFAULT 1200,
      "prepTimeMinutes" INTEGER NOT NULL DEFAULT 15,
      "originPostcode" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const columns = [
    `"pickupEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `"deliveryEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `"dineInEnabled" BOOLEAN NOT NULL DEFAULT true`,
    `"stripeEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `"payInStoreEnabled" BOOLEAN NOT NULL DEFAULT true`,
    `"cashOnCollectionEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `"cashOnDeliveryEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `"deliveryRadiusMiles" DOUBLE PRECISION NOT NULL DEFAULT 5`,
    `"deliveryFeePerMilePence" INTEGER NOT NULL DEFAULT 0`,
    `"minimumOrderPence" INTEGER NOT NULL DEFAULT 1200`,
    `"prepTimeMinutes" INTEGER NOT NULL DEFAULT 15`,
    `"originPostcode" TEXT`
  ];
  for (const column of columns) {
    await db.$executeRawUnsafe(`ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS ${column};`);
  }
  await db.$executeRawUnsafe(`
    INSERT INTO "AppSettings" ("id", "restaurantName", "businessName", "originPostcode")
    VALUES ('global', 'Saba Cafe', 'Saba Cafe', $1)
    ON CONFLICT ("id") DO NOTHING;
  `, businessInfo.deliveryOriginPostcode);
}

async function readDatabaseSettings() {
  await ensureAppSettingsSchema();
  const rows = (await db.$queryRawUnsafe(`SELECT * FROM "AppSettings" WHERE "id" = 'global' LIMIT 1`)) as Partial<OperationsSettings>[];
  return rows[0] ? normalizeSettings(rows[0]) : null;
}

async function writeDatabaseSettings(settings: OperationsSettings) {
  await ensureAppSettingsSchema();
  await db.$executeRawUnsafe(
    `INSERT INTO "AppSettings" (
      "id", "restaurantName", "businessName", "pickupEnabled", "deliveryEnabled", "dineInEnabled", "stripeEnabled",
      "payInStoreEnabled", "cashOnCollectionEnabled", "cashOnDeliveryEnabled", "deliveryRadiusMiles", "deliveryFeePerMilePence",
      "minimumOrderPence", "prepTimeMinutes", "originPostcode", "updatedAt"
    ) VALUES (
      'global', 'Saba Cafe', 'Saba Cafe', $1, $2, $3, $4,
      $5, $6, $7, $8, $9,
      $10, $11, $12, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO UPDATE SET
      "pickupEnabled" = EXCLUDED."pickupEnabled",
      "deliveryEnabled" = EXCLUDED."deliveryEnabled",
      "dineInEnabled" = EXCLUDED."dineInEnabled",
      "stripeEnabled" = EXCLUDED."stripeEnabled",
      "payInStoreEnabled" = EXCLUDED."payInStoreEnabled",
      "cashOnCollectionEnabled" = EXCLUDED."cashOnCollectionEnabled",
      "cashOnDeliveryEnabled" = EXCLUDED."cashOnDeliveryEnabled",
      "deliveryRadiusMiles" = EXCLUDED."deliveryRadiusMiles",
      "deliveryFeePerMilePence" = EXCLUDED."deliveryFeePerMilePence",
      "minimumOrderPence" = EXCLUDED."minimumOrderPence",
      "prepTimeMinutes" = EXCLUDED."prepTimeMinutes",
      "originPostcode" = EXCLUDED."originPostcode",
      "updatedAt" = CURRENT_TIMESTAMP`,
    settings.pickupEnabled,
    settings.deliveryEnabled,
    settings.dineInEnabled,
    settings.stripeEnabled,
    settings.payInStoreEnabled,
    settings.cashOnCollectionEnabled,
    settings.cashOnDeliveryEnabled,
    settings.deliveryRadiusMiles,
    settings.deliveryFeePerMilePence,
    settings.minimumOrderPence,
    settings.prepTimeMinutes,
    settings.originPostcode
  );
}

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
    const databaseSettings = await readDatabaseSettings();
    if (databaseSettings) return databaseSettings;
  } catch {
    // If Neon is unavailable during local setup, fall back to bundled/file settings.
  }

  try {
    const raw = await readFirstAvailableSettings();
    return normalizeSettings(JSON.parse(raw) as Partial<OperationsSettings>);
  } catch {
    return defaultOperationsSettings();
  }
}

export async function writeOperationsSettings(input: OperationsSettings) {
  const settings = normalizeSettings(input);
  try {
    await writeDatabaseSettings(settings);
  } catch {
    const settingsPath = await writableSettingsPath();
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  }
  return settings;
}
