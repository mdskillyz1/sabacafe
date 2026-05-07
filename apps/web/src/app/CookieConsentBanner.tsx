"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Consent = {
  essential: true;
  analytics: boolean;
  functional: boolean;
  updatedAt: string;
};

const storageKey = "saba_cookie_consent";

export function CookieConsentBanner({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    setVisible(!window.localStorage.getItem(storageKey));
  }, []);

  function save(consent: Omit<Consent, "updatedAt">) {
    window.localStorage.setItem(storageKey, JSON.stringify({ ...consent, updatedAt: new Date().toISOString() }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-4xl rounded-lg border border-date/10 bg-white p-4 text-date shadow-soft">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="font-display text-2xl font-semibold">Cookie preferences</p>
          <p className="mt-2 text-sm leading-6 text-date/70">{text}</p>
          <Link href="/cookie-policy" className="mt-2 inline-flex text-sm font-semibold text-mint">
            Read the Cookie Policy
          </Link>
          {manage ? (
            <div className="mt-4 grid gap-3 text-sm">
              <label className="flex items-center justify-between gap-4 rounded-md bg-cream p-3">
                <span><strong>Essential cookies</strong><br />Required for security, sessions, and core website features.</span>
                <input type="checkbox" checked readOnly />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-md bg-cream p-3">
                <span><strong>Analytics cookies</strong><br />Help us understand website visits and ordering flow performance.</span>
                <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-md bg-cream p-3">
                <span><strong>Functional cookies</strong><br />Remember preferences and improve website usability.</span>
                <input type="checkbox" checked={functional} onChange={(event) => setFunctional(event.target.checked)} />
              </label>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 md:min-w-52">
          <button onClick={() => save({ essential: true, analytics: true, functional: true })} className="focus-ring rounded-full bg-date px-5 py-3 text-sm font-semibold text-cream">
            Accept all
          </button>
          <button onClick={() => save({ essential: true, analytics: false, functional: false })} className="focus-ring rounded-full border border-date/15 px-5 py-3 text-sm font-semibold text-date">
            Reject non-essential
          </button>
          {manage ? (
            <button onClick={() => save({ essential: true, analytics, functional })} className="focus-ring rounded-full bg-mint px-5 py-3 text-sm font-semibold text-white">
              Save preferences
            </button>
          ) : (
            <button onClick={() => setManage(true)} className="focus-ring rounded-full bg-cream px-5 py-3 text-sm font-semibold text-date">
              Manage preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
