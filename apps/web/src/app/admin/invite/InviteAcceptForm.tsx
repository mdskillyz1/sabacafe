"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export function InviteAcceptForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/staff-invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(Object.values(body.errors ?? {}).join(" ") || body.error || "Invite could not be accepted.");
      return;
    }
    window.location.href = "/admin/login?invite=accepted";
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 w-full max-w-md rounded-lg border border-date/10 bg-white p-6 shadow-soft">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron/15 text-clay">
        <LockKeyhole size={22} />
      </span>
      <h1 className="mt-4 font-display text-4xl font-semibold text-date">Create staff password</h1>
      <p className="mt-3 text-sm leading-6 text-date/65">Choose a secure password for your Saba Cafe staff account.</p>
      <label className="mt-6 block text-sm font-semibold text-date/70">
        Password
        <span className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white focus-within:ring-2 focus-within:ring-mint">
          <input
            type={show ? "text" : "password"}
            value={password}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border-0 px-4 py-3 font-normal outline-none"
            required
          />
          <button type="button" onClick={() => setShow((current) => !current)} className="focus-ring px-3 text-date/55">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button disabled={loading} className="focus-ring mt-6 w-full rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-60">
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
