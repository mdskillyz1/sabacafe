import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@saba/database";
import bundledAdminUsers from "../../data/admin-users.json";

const scrypt = promisify(scryptCallback);

export type AdminRole = "SUPER_ADMIN" | "STAFF";

export type AdminUserRecord = {
  id: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminUserStore = {
  users: AdminUserRecord[];
  updatedAt: string;
};

export type PublicAdminUser = Omit<AdminUserRecord, "passwordHash">;

const adminUsersFileName = "admin-users.json";
const db = prisma as any;
const candidateStorePaths = [
  path.join(process.cwd(), "data", adminUsersFileName),
  path.join(process.cwd(), "apps", "web", "data", adminUsersFileName),
  path.join("/tmp", "saba-cafe", adminUsersFileName)
];

const now = () => new Date().toISOString();

function databaseAdminUsersEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function defaultAdminUsers(): AdminUserRecord[] {
  const createdAt = "2026-06-09T00:00:00.000Z";
  return [
    {
      id: "admin-owner",
      username: "saba-owner",
      passwordHash:
        "scrypt$h_7wqcOs3vly7LfobF6psg$86_1YbpBzttoJMono4fnj2NBEeX4KuysgRDA7azJdKc2aK7pOZcMD4MPtnOMOm-eLIgCbAtO-A1CKofnsDu3ZQ",
      role: "SUPER_ADMIN",
      isActive: true,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: "admin-shop",
      username: "saba-shop",
      passwordHash:
        "scrypt$xh27_SETu0WrxCwjBHZBtA$NGE6QEaHMG5H3GjMlhv9DLHYMEq_B8sa0gabcSXMIEefsiV58fSR0EfR1UI8LyagHq8xF3YYkIs5oG0W-Oli4w",
      role: "STAFF",
      isActive: true,
      createdAt,
      updatedAt: createdAt
    }
  ];
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function publicUser(user: AdminUserRecord): PublicAdminUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function dbUserToRecord(user: any): AdminUserRecord {
  return {
    id: user.id,
    username: normalizeUsername(user.username),
    passwordHash: user.passwordHash,
    role: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "STAFF",
    isActive: user.isActive !== false,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt ?? now(),
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt ?? now()
  };
}

async function ensureDefaultDbAdminUsers() {
  const defaults = defaultAdminUsers();
  await db.adminUser.updateMany({
    where: { username: "admin" },
    data: { isActive: false }
  });

  for (const user of defaults) {
    await db.adminUser.upsert({
      where: { username: user.username },
      update: {
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: true
      },
      create: {
        username: user.username,
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: true
      }
    });
  }
}

async function readDbAdminUsers(): Promise<AdminUserRecord[]> {
  await ensureDefaultDbAdminUsers();
  const users = await db.adminUser.findMany({
    where: {
      username: {
        not: "admin"
      }
    },
    orderBy: [{ role: "asc" }, { username: "asc" }]
  });
  return users.map(dbUserToRecord);
}

async function readFirstAvailableStore() {
  for (const storePath of candidateStorePaths) {
    try {
      return await fs.readFile(storePath, "utf8");
    } catch {
      // Try the next store path. Serverless deployments may only allow /tmp writes.
    }
  }
  return JSON.stringify(bundledAdminUsers);
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

function normalizeStore(input: Partial<AdminUserStore>): AdminUserStore {
  const users = Array.isArray(input.users) ? input.users : [];
  const normalizedUsers: AdminUserRecord[] = users
    .filter((user) => user.username && user.passwordHash)
    .map((user) => ({
      id: user.id,
      username: normalizeUsername(user.username),
      passwordHash: user.passwordHash,
      role: user.role === "STAFF" ? ("STAFF" as const) : ("SUPER_ADMIN" as const),
      isActive: user.isActive !== false,
      createdAt: user.createdAt ?? now(),
      updatedAt: user.updatedAt ?? now()
    }))
    .filter((user) => user.username !== "admin");

  for (const user of defaultAdminUsers().reverse()) {
    if (!normalizedUsers.some((candidate) => candidate.username === user.username)) {
      normalizedUsers.unshift(user);
    }
  }

  return {
    users: normalizedUsers,
    updatedAt: input.updatedAt ?? now()
  };
}

export async function readAdminUserStore(): Promise<AdminUserStore> {
  if (databaseAdminUsersEnabled()) {
    try {
      return { users: await readDbAdminUsers(), updatedAt: now() };
    } catch (error) {
      console.error("Database admin users unavailable, falling back to bundled users.", error);
    }
  }

  try {
    const raw = await readFirstAvailableStore();
    return normalizeStore(JSON.parse(raw) as Partial<AdminUserStore>);
  } catch {
    return normalizeStore({ users: [] });
  }
}

async function writeAdminUserStore(store: AdminUserStore) {
  const next = { ...store, updatedAt: now() };
  const storePath = await writableStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, `${JSON.stringify(next, null, 2)}\n`);
  return normalizeStore(next);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [method, salt, storedHash] = passwordHash.split("$");
  if (method !== "scrypt" || !salt || !storedHash) return false;
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(storedHash, "base64url");
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}

export async function authenticateAdmin(username: string, password: string) {
  if (databaseAdminUsersEnabled()) {
    try {
      await ensureDefaultDbAdminUsers();
      const user = await db.adminUser.findUnique({ where: { username: normalizeUsername(username) } });
      const record = user ? dbUserToRecord(user) : null;
      if (!record || !record.isActive) return null;
      const valid = await verifyPassword(password, record.passwordHash);
      return valid ? record : null;
    } catch (error) {
      console.error("Database admin authentication unavailable, falling back to bundled users.", error);
    }
  }

  const store = await readAdminUserStore();
  const user = store.users.find((candidate) => candidate.username === normalizeUsername(username));
  if (!user || !user.isActive) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export async function listAdminUsers() {
  const store = await readAdminUserStore();
  return store.users.map(publicUser);
}

export async function findAdminUserById(id: string) {
  const store = await readAdminUserStore();
  const user = store.users.find((candidate) => candidate.id === id);
  return user ? publicUser(user) : null;
}

export function validateAdminUserInput(input: { username?: string; password?: string; role?: string }) {
  const errors: Record<string, string> = {};
  const username = normalizeUsername(input.username ?? "");
  if (input.username !== undefined && !/^[a-z0-9._-]{3,32}$/.test(username)) {
    errors.username = "Username must be 3-32 characters using letters, numbers, dots, dashes, or underscores.";
  }
  if (input.password !== undefined && input.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (input.role && input.role !== "SUPER_ADMIN" && input.role !== "STAFF") {
    errors.role = "Choose Owner or Shop.";
  }
  return errors;
}

export async function createAdminUser(input: { username: string; password: string; role: AdminRole }) {
  const errors = validateAdminUserInput(input);
  if (Object.keys(errors).length) return { ok: false as const, errors };

  const store = await readAdminUserStore();
  const username = normalizeUsername(input.username);
  if (store.users.some((user) => user.username === username)) {
    return { ok: false as const, errors: { username: "That username already exists." } };
  }

  if (databaseAdminUsersEnabled()) {
    try {
      await db.adminUser.create({
        data: {
          username,
          passwordHash: await hashPassword(input.password),
          role: input.role,
          isActive: true
        }
      });
      return { ok: true as const, users: await listAdminUsers() };
    } catch (error) {
      console.error("Database admin create failed.", error);
      return { ok: false as const, errors: { user: "Could not create admin user. Check the database connection." } };
    }
  }

  const timestamp = now();
  const nextUser: AdminUserRecord = {
    id: `admin-${randomBytes(10).toString("hex")}`,
    username,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const nextStore = await writeAdminUserStore({ ...store, users: [...store.users, nextUser] });
  return { ok: true as const, users: nextStore.users.map(publicUser) };
}

export async function updateAdminUser(
  id: string,
  input: { username?: string; password?: string; role?: AdminRole; isActive?: boolean }
) {
  const errors = validateAdminUserInput(input);
  if (Object.keys(errors).length) return { ok: false as const, errors };

  const store = await readAdminUserStore();
  const index = store.users.findIndex((user) => user.id === id);
  if (index === -1) return { ok: false as const, errors: { user: "Admin user not found." } };

  const nextUsers = [...store.users];
  const current = nextUsers[index];
  const username = input.username ? normalizeUsername(input.username) : current.username;
  if (nextUsers.some((user) => user.id !== id && user.username === username)) {
    return { ok: false as const, errors: { username: "That username already exists." } };
  }

  if (databaseAdminUsersEnabled()) {
    try {
      await db.adminUser.update({
        where: { id },
        data: {
          username,
          role: input.role ?? current.role,
          isActive: input.isActive ?? current.isActive,
          ...(input.password ? { passwordHash: await hashPassword(input.password) } : {})
        }
      });
      return { ok: true as const, users: await listAdminUsers() };
    } catch (error) {
      console.error("Database admin update failed.", error);
      return { ok: false as const, errors: { user: "Could not update admin user. Check the database connection." } };
    }
  }

  nextUsers[index] = {
    ...current,
    username,
    role: input.role ?? current.role,
    isActive: input.isActive ?? current.isActive,
    passwordHash: input.password ? await hashPassword(input.password) : current.passwordHash,
    updatedAt: now()
  };

  const nextStore = await writeAdminUserStore({ ...store, users: nextUsers });
  return { ok: true as const, users: nextStore.users.map(publicUser) };
}

export async function deleteAdminUser(id: string) {
  const store = await readAdminUserStore();
  const user = store.users.find((candidate) => candidate.id === id);
  if (!user) return { ok: false as const, errors: { user: "Admin user not found." } };
  if (user.role === "SUPER_ADMIN" && store.users.filter((candidate) => candidate.role === "SUPER_ADMIN").length <= 1) {
    return { ok: false as const, errors: { user: "At least one Owner account must remain." } };
  }

  if (databaseAdminUsersEnabled()) {
    try {
      await db.adminUser.delete({ where: { id } });
      return { ok: true as const, users: await listAdminUsers() };
    } catch (error) {
      console.error("Database admin delete failed.", error);
      return { ok: false as const, errors: { user: "Could not delete admin user. Check the database connection." } };
    }
  }

  const nextStore = await writeAdminUserStore({ ...store, users: store.users.filter((candidate) => candidate.id !== id) });
  return { ok: true as const, users: nextStore.users.map(publicUser) };
}
