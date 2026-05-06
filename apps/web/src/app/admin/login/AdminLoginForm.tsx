"use client";

import { use, useState } from "react";
import { LockKeyhole } from "lucide-react";

export function AdminLoginForm({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = use(searchParams);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Incorrect password.");
      return;
    }
    window.location.href = params.next && params.next.startsWith("/admin") ? params.next : "/admin";
  }

  return (
    <form onSubmit={login} className="w-full rounded-lg border border-date/10 bg-white p-8 shadow-soft">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-date text-cream">
        <LockKeyhole size={22} />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-clay">Staff only</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-date">Admin login</h1>
      <p className="mt-3 leading-7 text-date/65">Enter the staff password to manage menu, orders, delivery settings, and reviews.</p>

      <label className="mt-6 block text-sm font-semibold text-date/70">
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal"
          required
        />
      </label>

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <button disabled={loading} className="focus-ring mt-6 w-full rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-60">
        {loading ? "Checking..." : "Enter admin"}
      </button>
    </form>
  );
}
