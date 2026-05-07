"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type AdminBackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export function AdminBackButton({ fallbackHref = "/admin", label = "Back" }: AdminBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-date/15 bg-white px-4 py-2 text-sm font-semibold text-date shadow-sm transition hover:border-date/30 hover:bg-cream"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
