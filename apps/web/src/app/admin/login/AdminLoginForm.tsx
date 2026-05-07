"use client";

import { use, useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";

export function AdminLoginForm({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = use(searchParams);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Incorrect username or password.");
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
      <p className="mt-3 leading-7 text-date/65">Sign in with your admin account to manage menu, orders, bookings, settings, and reviews.</p>

      <label className="mt-6 block text-sm font-semibold text-date/70">
        Username
        <span className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white focus-within:ring-2 focus-within:ring-mint">
          <span className="flex items-center border-r border-date/10 px-3 text-date/45">
            <UserRound size={18} />
          </span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full border-0 px-4 py-3 font-normal outline-none"
            required
          />
        </span>
      </label>

      <label className="mt-4 block text-sm font-semibold text-date/70">
        Password
        <span className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white focus-within:ring-2 focus-within:ring-mint">
          <span className="flex items-center border-r border-date/10 px-3 text-date/45">
            <LockKeyhole size={18} />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border-0 px-4 py-3 font-normal outline-none"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="focus-ring flex items-center px-3 text-date/55"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <button disabled={loading} className="focus-ring mt-6 w-full rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-60">
        {loading ? "Signing in..." : "Log in"}
      </button>
    </form>
  );
}
