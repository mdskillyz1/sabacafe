"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function sessionId() {
  const key = "saba_visitor_session";
  let existing = window.localStorage.getItem(key);
  if (!existing) {
    existing = crypto.randomUUID();
    window.localStorage.setItem(key, existing);
  }
  return existing;
}

function eventTypeForPath(path: string) {
  if (path.startsWith("/menu")) return "menu_view";
  if (path.startsWith("/order")) return "checkout_start";
  if (path.includes("#booking")) return "booking_form_view";
  return "page_view";
}

export function WebsiteEventTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const path = `${pathname}${window.location.hash}`;
    const type = eventTypeForPath(path);
    fetch("/api/website-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, path, sessionId: sessionId() }),
      keepalive: true
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
