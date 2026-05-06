"use client";

export function AdminLogoutButton() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="focus-ring rounded-full border border-cream/20 px-4 py-2 text-sm font-semibold text-cream/80 transition hover:text-cream"
    >
      Log out
    </button>
  );
}
