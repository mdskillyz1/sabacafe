"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Eye, EyeOff, MailPlus, Save, Trash2 } from "lucide-react";
import type { AdminRole, PublicAdminUser } from "@/lib/adminUsers";

type Draft = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: AdminRole;
  invite: boolean;
};
type StaffActivity = {
  id: string;
  type: string;
  message: string;
  username?: string;
  role?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const roleLabels: Record<AdminRole, string> = {
  SUPER_ADMIN: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
  KITCHEN: "Kitchen"
};

const emptyDraft: Draft = { fullName: "", email: "", username: "", password: "", role: "STAFF", invite: true };

export function AdminUsersManager() {
  const [users, setUsers] = useState<PublicAdminUser[]>([]);
  const [activity, setActivity] = useState<StaffActivity[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [response, activityResponse] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/analytics/staff-activity?range=last30", { cache: "no-store" })
    ]);
    const [body, activityBody] = await Promise.all([response.json(), activityResponse.json().catch(() => null)]);
    if (!response.ok) {
      setError(body.error ?? "Only Owner accounts can manage staff.");
      setLoading(false);
      return;
    }
    setUsers(body.users);
    setActivity(activityBody?.staffActivity?.recent ?? []);
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
    setInviteUrl("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(Object.values(body.errors ?? {}).join(" ") || "Could not create staff account.");
      return;
    }
    setUsers(body.users);
    setDraft(emptyDraft);
    setInviteUrl(body.inviteUrl ?? "");
    setMessage(body.inviteUrl ? "Invite created. Email will send when email provider is configured." : "Staff account created.");
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
      setError(Object.values(body.errors ?? {}).join(" ") || "Could not update staff account.");
      return;
    }
    setUsers(body.users);
    setPasswords((current) => ({ ...current, [user.id]: "" }));
    setMessage("Staff account updated.");
  }

  async function removeUser(user: PublicAdminUser) {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(Object.values(body.errors ?? {}).join(" ") || "Could not delete staff account.");
      return;
    }
    setUsers(body.users);
    setMessage("Staff account deleted.");
  }

  function exportActivity() {
    const rows = [
      ["Date/time", "Staff", "Role", "Action", "Order ID", "Table", "Message"],
      ...activity.map((event) => [
        new Date(event.createdAt).toLocaleString("en-GB"),
        event.username ?? "",
        event.role ?? "",
        event.type,
        event.entityId ?? "",
        String(event.metadata?.tableNumber ?? ""),
        event.message
      ])
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `saba-staff-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="mt-8 rounded-lg border border-date/10 bg-white p-6 text-date/65">Loading staff...</p>;
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={createUser} className="rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-saffron/15 text-clay">
            <MailPlus size={21} />
          </span>
          <div>
            <h2 className="font-display text-3xl font-semibold text-date">Invite staff</h2>
            <p className="mt-2 text-sm leading-6 text-date/65">Invite staff to create their own password. Owner accounts can still be created directly.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-date/70">
            Full name
            <input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal" required />
          </label>
          <label className="block text-sm font-semibold text-date/70">
            Email
            <input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal" required />
          </label>
          {!draft.invite ? (
            <>
              <label className="block text-sm font-semibold text-date/70">
                Username
                <input value={draft.username} onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal" required />
              </label>
              <label className="block text-sm font-semibold text-date/70">
                Password
                <span className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white focus-within:ring-2 focus-within:ring-mint">
                  <input type={showPassword ? "text" : "password"} value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} className="w-full border-0 px-4 py-3 font-normal outline-none" required />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="focus-ring px-3 text-date/55">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
            </>
          ) : null}
          <label className="block text-sm font-semibold text-date/70">
            Role
            <select value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as AdminRole, invite: event.target.value !== "SUPER_ADMIN" }))} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal">
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="SUPER_ADMIN">Owner</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-md bg-cream p-3 text-sm font-semibold text-date/70">
            <input type="checkbox" checked={draft.invite} disabled={draft.role === "SUPER_ADMIN"} onChange={(event) => setDraft((current) => ({ ...current, invite: event.target.checked }))} />
            Send setup invite instead of setting password now
          </label>
        </div>

        <button disabled={saving} className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-60">
          <MailPlus size={17} /> {draft.invite ? "Send invite" : "Create account"}
        </button>
        {inviteUrl ? (
          <button type="button" onClick={() => navigator.clipboard?.writeText(inviteUrl)} className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-date/15 px-5 py-3 text-sm font-semibold text-date">
            <Copy size={16} /> Copy invite link
          </button>
        ) : null}
      </form>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-semibold text-date">{user.fullName || user.username}</p>
                <p className="mt-1 text-sm text-date/55">{user.email || user.username} • {roleLabels[user.role]} • {user.isActive ? "Active" : "Disabled"}</p>
              </div>
              <button onClick={() => updateUser(user, { isActive: !user.isActive })} className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold ${user.isActive ? "bg-red-50 text-red-700" : "bg-mint/10 text-mint"}`}>
                {user.isActive ? "Disable" : "Enable"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={user.fullName ?? ""} onChange={(event) => setUsers((current) => current.map((row) => (row.id === user.id ? { ...row, fullName: event.target.value } : row)))} placeholder="Full name" className="focus-ring rounded-md border border-date/15 px-4 py-3" />
              <input value={user.email ?? ""} onChange={(event) => setUsers((current) => current.map((row) => (row.id === user.id ? { ...row, email: event.target.value } : row)))} placeholder="Email" className="focus-ring rounded-md border border-date/15 px-4 py-3" />
              <input value={user.username} onChange={(event) => setUsers((current) => current.map((row) => (row.id === user.id ? { ...row, username: event.target.value } : row)))} className="focus-ring rounded-md border border-date/15 px-4 py-3" />
              <select value={user.role} onChange={(event) => updateUser(user, { role: event.target.value as AdminRole })} className="focus-ring rounded-md border border-date/15 px-4 py-3">
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="KITCHEN">Kitchen</option>
                <option value="SUPER_ADMIN">Owner</option>
              </select>
              <input type="password" value={passwords[user.id] ?? ""} onChange={(event) => setPasswords((current) => ({ ...current, [user.id]: event.target.value }))} placeholder="New password" className="focus-ring rounded-md border border-date/15 px-4 py-3" />
              <div className="flex gap-2">
                <button onClick={() => updateUser(user, { username: user.username, fullName: user.fullName, email: user.email, password: passwords[user.id] || undefined })} className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-date px-4 py-3 text-sm font-semibold text-cream">
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

      <section className="rounded-lg border border-date/10 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold text-date">Staff activity</h2>
            <p className="mt-2 text-sm leading-6 text-date/65">Recent owner, manager, staff, and kitchen actions from the last 30 days.</p>
          </div>
          <button type="button" onClick={exportActivity} disabled={!activity.length} className="focus-ring inline-flex items-center gap-2 rounded-full border border-date/15 px-4 py-2 text-sm font-semibold text-date disabled:opacity-50">
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="mt-5 overflow-x-auto">
          {activity.length ? (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-date/50">
                <tr>
                  <th className="py-2">Time</th>
                  <th>Staff</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((event) => (
                  <tr key={event.id} className="border-t border-date/10">
                    <td className="py-3 text-date/60">{new Date(event.createdAt).toLocaleString("en-GB")}</td>
                    <td className="font-semibold text-date">{event.username ?? "System"}<span className="block text-xs font-normal text-date/45">{event.role ?? ""}</span></td>
                    <td>{event.type.replaceAll("_", " ")}</td>
                    <td>{String(event.metadata?.tableNumber ?? "-")}</td>
                    <td className="text-date/70">{event.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded-md bg-cream p-4 text-sm text-date/60">No staff activity yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
