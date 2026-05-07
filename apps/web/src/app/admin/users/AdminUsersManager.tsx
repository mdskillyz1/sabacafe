"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Save, Trash2, UserCog } from "lucide-react";
import type { AdminRole, PublicAdminUser } from "@/lib/adminUsers";

type Draft = {
  username: string;
  password: string;
  role: AdminRole;
};

const emptyDraft: Draft = { username: "", password: "", role: "STAFF" };

export function AdminUsersManager() {
  const [users, setUsers] = useState<PublicAdminUser[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Only Super Admins can manage users.");
      setLoading(false);
      return;
    }
    setUsers(body.users);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(Object.values(body.errors ?? {}).join(" ") || "Could not create admin user.");
      return;
    }
    setUsers(body.users);
    setDraft(emptyDraft);
    setMessage("Admin user created.");
  }

  async function updateUser(user: PublicAdminUser, patch: Partial<PublicAdminUser> & { password?: string }) {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(Object.values(body.errors ?? {}).join(" ") || "Could not update admin user.");
      return;
    }
    setUsers(body.users);
    setPasswords((current) => ({ ...current, [user.id]: "" }));
    setMessage("Admin user updated.");
  }

  async function removeUser(user: PublicAdminUser) {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(Object.values(body.errors ?? {}).join(" ") || "Could not delete admin user.");
      return;
    }
    setUsers(body.users);
    setMessage("Admin user deleted.");
  }

  if (loading) {
    return <p className="mt-8 rounded-lg border border-date/10 bg-white p-6 text-date/65">Loading admin users...</p>;
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={createUser} className="rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-saffron/15 text-clay">
            <UserCog size={21} />
          </span>
          <div>
            <h2 className="font-display text-3xl font-semibold text-date">Create admin</h2>
            <p className="mt-2 text-sm leading-6 text-date/65">Use strong passwords and only give Super Admin to trusted owners.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-date/70">
            Username
            <input
              value={draft.username}
              onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))}
              className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-date/70">
            Password
            <span className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white focus-within:ring-2 focus-within:ring-mint">
              <input
                type={showPassword ? "text" : "password"}
                value={draft.password}
                onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
                className="w-full border-0 px-4 py-3 font-normal outline-none"
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="focus-ring px-3 text-date/55">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <label className="block text-sm font-semibold text-date/70">
            Role
            <select
              value={draft.role}
              onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as AdminRole }))}
              className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal"
            >
              <option value="STAFF">Staff</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </label>
        </div>

        <button disabled={saving} className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-60">
          <Plus size={17} /> Create admin
        </button>
      </form>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-semibold text-date">{user.username}</p>
                <p className="mt-1 text-sm text-date/55">{user.role === "SUPER_ADMIN" ? "Super Admin" : "Staff"} • {user.isActive ? "Active" : "Disabled"}</p>
              </div>
              <button
                onClick={() => updateUser(user, { isActive: !user.isActive })}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold ${user.isActive ? "bg-red-50 text-red-700" : "bg-mint/10 text-mint"}`}
              >
                {user.isActive ? "Disable" : "Enable"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={user.username}
                onChange={(event) => setUsers((current) => current.map((row) => (row.id === user.id ? { ...row, username: event.target.value } : row)))}
                className="focus-ring rounded-md border border-date/15 px-4 py-3"
              />
              <select
                value={user.role}
                onChange={(event) => updateUser(user, { role: event.target.value as AdminRole })}
                className="focus-ring rounded-md border border-date/15 px-4 py-3"
              >
                <option value="STAFF">Staff</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <input
                type="password"
                value={passwords[user.id] ?? ""}
                onChange={(event) => setPasswords((current) => ({ ...current, [user.id]: event.target.value }))}
                placeholder="New password"
                className="focus-ring rounded-md border border-date/15 px-4 py-3"
              />
              <div className="flex gap-2">
                <button onClick={() => updateUser(user, { username: user.username, password: passwords[user.id] || undefined })} className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-date px-4 py-3 text-sm font-semibold text-cream">
                  <Save size={16} /> Save
                </button>
                <button onClick={() => removeUser(user)} className="focus-ring rounded-full border border-red-200 px-4 py-3 text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {message ? <p className="rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint">{message}</p> : null}
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
