import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
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
const candidateStorePaths = [
  path.join(process.cwd(), "data", adminUsersFileName),
  path.join(process.cwd(), "apps", "web", "data", adminUsersFileName),
  path.join("/tmp", "saba-cafe", adminUsersFileName)
];

const defaultAdminHash =
  "scrypt$pvw3HbhBXpkUHB9AQtnKLQ$KFOK0P0Em_8hPHhkCn9LDzIGhKsDoglCV7fgiD6LQ8T_dxnCt3JDKGQ93sXjdjfUl8anu40z9mmA13JOKM74NQ";

const now = () => new Date().toISOString();

function defaultAdminUser(): AdminUserRecord {
  const createdAt = "2026-05-07T00:00:00.000Z";
  return {
    id: "admin-dev",
    username: "admin",
    passwordHash: defaultAdminHash,
    role: "SUPER_ADMIN",
    isActive: true,
    createdAt,
    updatedAt: createdAt
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function publicUser(user: AdminUserRecord): PublicAdminUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
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
    }));

  if (!normalizedUsers.some((user) => user.username === "admin")) {
    normalizedUsers.unshift(defaultAdminUser());
  }

  return {
    users: normalizedUsers,
    updatedAt: input.updatedAt ?? now()
  };
}

export async function readAdminUserStore(): Promise<AdminUserStore> {
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
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    errors.username = "Username must be 3-32 characters using letters, numbers, dots, dashes, or underscores.";
  }
  if (input.password !== undefined && input.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (input.role && input.role !== "SUPER_ADMIN" && input.role !== "STAFF") {
    errors.role = "Choose Super Admin or Staff.";
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
    return { ok: false as const, errors: { user: "At least one Super Admin must remain." } };
  }
  const nextStore = await writeAdminUserStore({ ...store, users: store.users.filter((candidate) => candidate.id !== id) });
  return { ok: true as const, users: nextStore.users.map(publicUser) };
}
