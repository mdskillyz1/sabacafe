import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@saba/database";
import bundledAdminUsers from "../../data/admin-users.json";

const scrypt = promisify(scryptCallback);

export type AdminRole = "SUPER_ADMIN" | "MANAGER" | "STAFF" | "KITCHEN";

export type AdminUserRecord = {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  inviteTokenHash?: string;
  inviteExpiresAt?: string;
  inviteAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type AdminUserStore = {
  users: AdminUserRecord[];
  updatedAt: string;
};

export type PublicAdminUser = Omit<AdminUserRecord, "passwordHash" | "inviteTokenHash">;

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
  const { passwordHash: _passwordHash, inviteTokenHash: _inviteTokenHash, ...safeUser } = user;
  return safeUser;
}

function normalizeRole(role?: string): AdminRole {
  if (role === "SUPER_ADMIN" || role === "MANAGER" || role === "KITCHEN") return role;
  return "STAFF";
}

function normalizeEmail(email?: string) {
  return String(email ?? "").trim().toLowerCase();
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function dbUserToRecord(user: any): AdminUserRecord {
  return {
    id: user.id,
    username: normalizeUsername(user.username),
    fullName: user.fullName ?? undefined,
    email: user.email ?? undefined,
    passwordHash: user.passwordHash,
    role: normalizeRole(user.role),
    isActive: user.isActive !== false,
    inviteTokenHash: user.inviteTokenHash ?? undefined,
    inviteExpiresAt: user.inviteExpiresAt instanceof Date ? user.inviteExpiresAt.toISOString() : user.inviteExpiresAt ?? undefined,
    inviteAcceptedAt: user.inviteAcceptedAt instanceof Date ? user.inviteAcceptedAt.toISOString() : user.inviteAcceptedAt ?? undefined,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt ?? now(),
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt ?? now()
  };
}

async function addEnumValue(typeName: string, value: string) {
  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN
        ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}';
      END IF;
    END $$;
  `);
}

async function ensureAdminUserSchema() {
  await addEnumValue("AdminRole", "MANAGER");
  await addEnumValue("AdminRole", "KITCHEN");
  await db.$executeRawUnsafe(`ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "fullName" TEXT;`);
  await db.$executeRawUnsafe(`ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "email" TEXT;`);
  await db.$executeRawUnsafe(`ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "inviteTokenHash" TEXT;`);
  await db.$executeRawUnsafe(`ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "inviteExpiresAt" TIMESTAMP(3);`);
  await db.$executeRawUnsafe(`ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "inviteAcceptedAt" TIMESTAMP(3);`);
  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email") WHERE "email" IS NOT NULL;`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AdminUser_inviteTokenHash_idx" ON "AdminUser"("inviteTokenHash");`);
}

async function ensureDefaultDbAdminUsers() {
  await ensureAdminUserSchema();
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
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.passwordHash,
      role: normalizeRole(user.role),
      isActive: user.isActive !== false,
      inviteTokenHash: user.inviteTokenHash,
      inviteExpiresAt: user.inviteExpiresAt,
      inviteAcceptedAt: user.inviteAcceptedAt,
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

export function validateAdminUserInput(input: { username?: string; password?: string; role?: string; fullName?: string; email?: string }, options: { passwordRequired?: boolean } = {}) {
  const errors: Record<string, string> = {};
  const username = normalizeUsername(input.username ?? "");
  if (input.username !== undefined && !/^[a-z0-9._-]{3,32}$/.test(username)) {
    errors.username = "Username must be 3-32 characters using letters, numbers, dots, dashes, or underscores.";
  }
  if ((options.passwordRequired || input.password !== undefined) && String(input.password ?? "").length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (input.role && !["SUPER_ADMIN", "MANAGER", "STAFF", "KITCHEN"].includes(input.role)) {
    errors.role = "Choose Owner, Manager, Staff, or Kitchen.";
  }
  if (input.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(input.email))) {
    errors.email = "Enter a valid email address.";
  }
  if (input.fullName !== undefined && input.fullName.trim().length < 2) {
    errors.fullName = "Enter the staff member's full name.";
  }
  return errors;
}

export async function createAdminUser(input: { username: string; password?: string; role: AdminRole; fullName?: string; email?: string }) {
  const password = input.password || randomBytes(18).toString("base64url");
  const errors = validateAdminUserInput({ ...input, password }, { passwordRequired: true });
  if (Object.keys(errors).length) return { ok: false as const, errors };

  const store = await readAdminUserStore();
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);
  if (store.users.some((user) => user.username === username)) {
    return { ok: false as const, errors: { username: "That username already exists." } };
  }
  if (email && store.users.some((user) => normalizeEmail(user.email) === email)) {
    return { ok: false as const, errors: { email: "That email already exists." } };
  }

  if (databaseAdminUsersEnabled()) {
    try {
      await db.adminUser.create({
        data: {
          username,
          fullName: input.fullName?.trim() || null,
          email: email || null,
          passwordHash: await hashPassword(password),
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
    fullName: input.fullName?.trim(),
    email: email || undefined,
    passwordHash: await hashPassword(password),
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
  input: { username?: string; password?: string; role?: AdminRole; isActive?: boolean; fullName?: string; email?: string }
) {
  const errors = validateAdminUserInput(input);
  if (Object.keys(errors).length) return { ok: false as const, errors };

  const store = await readAdminUserStore();
  const index = store.users.findIndex((user) => user.id === id);
  if (index === -1) return { ok: false as const, errors: { user: "Admin user not found." } };

  const nextUsers = [...store.users];
  const current = nextUsers[index];
  const username = input.username ? normalizeUsername(input.username) : current.username;
  const email = input.email !== undefined ? normalizeEmail(input.email) : normalizeEmail(current.email);
  if (nextUsers.some((user) => user.id !== id && user.username === username)) {
    return { ok: false as const, errors: { username: "That username already exists." } };
  }
  if (email && nextUsers.some((user) => user.id !== id && normalizeEmail(user.email) === email)) {
    return { ok: false as const, errors: { email: "That email already exists." } };
  }

  if (databaseAdminUsersEnabled()) {
    try {
      await db.adminUser.update({
        where: { id },
        data: {
          username,
          fullName: input.fullName ?? current.fullName ?? null,
          email: email || null,
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
    fullName: input.fullName ?? current.fullName,
    email: email || undefined,
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

export async function createStaffInvite(input: { fullName: string; email: string; role: AdminRole; origin: string }) {
  const baseUsername = normalizeUsername(input.email.split("@")[0].replace(/[^a-z0-9._-]/gi, "-")).slice(0, 24);
  const username = baseUsername.length >= 3 ? baseUsername : `staff-${randomBytes(3).toString("hex")}`;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48);
  const errors = validateAdminUserInput({ username, fullName: input.fullName, email: input.email, role: input.role, password: "temporary-pass" }, { passwordRequired: true });
  if (Object.keys(errors).length) return { ok: false as const, errors };
  if (input.role === "SUPER_ADMIN") return { ok: false as const, errors: { role: "Create Owner accounts with a password, not an email invite." } };

  const store = await readAdminUserStore();
  const email = normalizeEmail(input.email);
  if (store.users.some((user) => normalizeEmail(user.email) === email || user.username === username)) {
    return { ok: false as const, errors: { email: "That staff member already exists." } };
  }

  const passwordHash = await hashPassword(randomBytes(24).toString("base64url"));
  if (databaseAdminUsersEnabled()) {
    try {
      await ensureAdminUserSchema();
      await db.adminUser.create({
        data: {
          username,
          fullName: input.fullName.trim(),
          email,
          passwordHash,
          role: input.role,
          isActive: false,
          inviteTokenHash: tokenHash(token),
          inviteExpiresAt: expiresAt
        }
      });
    } catch (error) {
      console.error("Database staff invite failed.", error);
      return { ok: false as const, errors: { user: "Could not create staff invite. Check the database connection." } };
    }
  } else {
    const timestamp = now();
    await writeAdminUserStore({
      ...store,
      users: [
        ...store.users,
        {
          id: `admin-${randomBytes(10).toString("hex")}`,
          username,
          fullName: input.fullName.trim(),
          email,
          passwordHash,
          role: input.role,
          isActive: false,
          inviteTokenHash: tokenHash(token),
          inviteExpiresAt: expiresAt.toISOString(),
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ]
    });
  }

  const inviteUrl = `${input.origin}/admin/invite?token=${encodeURIComponent(token)}`;
  await sendStaffInviteEmail({ to: email, fullName: input.fullName, inviteUrl });
  return { ok: true as const, users: await listAdminUsers(), inviteUrl, expiresAt: expiresAt.toISOString() };
}

export async function acceptStaffInvite(input: { token: string; password: string }) {
  if (input.password.length < 8) return { ok: false as const, errors: { password: "Password must be at least 8 characters." } };
  const hash = tokenHash(input.token);
  if (databaseAdminUsersEnabled()) {
    try {
      await ensureAdminUserSchema();
      const users = (await db.adminUser.findMany({ where: { inviteTokenHash: hash }, take: 1 })) as any[];
      const user = users[0] ? dbUserToRecord(users[0]) : null;
      if (!user || !user.inviteExpiresAt || new Date(user.inviteExpiresAt).getTime() < Date.now()) {
        return { ok: false as const, errors: { token: "This invite link has expired or is invalid." } };
      }
      await db.adminUser.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(input.password),
          isActive: true,
          inviteTokenHash: null,
          inviteAcceptedAt: new Date()
        }
      });
      return { ok: true as const };
    } catch (error) {
      console.error("Accept staff invite failed.", error);
      return { ok: false as const, errors: { token: "Invite could not be accepted." } };
    }
  }

  const store = await readAdminUserStore();
  const user = store.users.find((candidate) => candidate.inviteTokenHash === hash);
  if (!user || !user.inviteExpiresAt || new Date(user.inviteExpiresAt).getTime() < Date.now()) {
    return { ok: false as const, errors: { token: "This invite link has expired or is invalid." } };
  }
  const acceptedPasswordHash = await hashPassword(input.password);
  const nextUsers = store.users.map((candidate) =>
    candidate.id === user.id
      ? { ...candidate, passwordHash: acceptedPasswordHash, isActive: true, inviteTokenHash: undefined, inviteAcceptedAt: now(), updatedAt: now() }
      : candidate
  );
  await writeAdminUserStore({ ...store, users: nextUsers });
  return { ok: true as const };
}

async function sendStaffInviteEmail(input: { to: string; fullName: string; inviteUrl: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.info(`Staff invite for ${input.to}: ${input.inviteUrl}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.STAFF_INVITE_FROM_EMAIL || "Saba Cafe <hello@sabacafe.co.uk>",
      to: input.to,
      subject: "Create your Saba Cafe staff account",
      html: `<p>Hello ${input.fullName},</p><p>You have been invited to create a Saba Cafe staff account.</p><p><a href="${input.inviteUrl}">Create your password</a></p><p>This link expires in 48 hours.</p>`
    })
  }).catch((error) => console.error("Staff invite email failed.", error));
}
