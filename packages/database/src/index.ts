import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrlKeys = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_POSTGRES_URL_NON_POOLING",
  "DATABASE_POSTGRES_URL_NO_SSL"
] as const;

function isUsableDatabaseUrl(value: string | undefined) {
  if (!value) return false;

  const url = value.trim();
  if (!url || url.includes("...") || url.includes("PASTE_")) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith("postgres") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function resolveDatabaseUrl() {
  const url = databaseUrlKeys.map((key) => process.env[key]).find(isUsableDatabaseUrl)?.trim();

  if (url && process.env.DATABASE_URL !== url) {
    process.env.DATABASE_URL = url;
  }

  return url;
}

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
