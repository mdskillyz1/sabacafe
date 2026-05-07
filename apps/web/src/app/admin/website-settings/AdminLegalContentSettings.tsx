"use client";

import { useEffect, useState } from "react";
import { FileText, Save } from "lucide-react";
import type { LegalContentStore } from "@saba/shared";

export function AdminLegalContentSettings() {
  const [store, setStore] = useState<LegalContentStore | null>(null);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/legal-content", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: LegalContentStore) => {
        setStore(data);
        setSelectedSlug(data.pages[0]?.slug ?? "");
      });
  }, []);

  const page = store?.pages.find((candidate) => candidate.slug === selectedSlug);

  function updatePage(nextPage: typeof page) {
    if (!store || !nextPage) return;
    setStore({
      ...store,
      pages: store.pages.map((candidate) => (candidate.slug === nextPage.slug ? nextPage : candidate))
    });
  }

  async function save() {
    if (!store) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/legal-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store)
    });
    const saved = await response.json();
    setSaving(false);
    setStore(saved);
    setMessage("Legal content saved.");
  }

  if (!store || !page) {
    return <p className="mt-8 rounded-lg border border-date/10 bg-white p-6 text-date/65">Loading legal content...</p>;
  }

  return (
    <section className="mt-8 rounded-lg border border-date/10 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-saffron/15 text-clay">
          <FileText size={21} />
        </span>
        <div>
          <h2 className="font-display text-3xl font-semibold text-date">Legal & website content</h2>
          <p className="mt-2 text-sm leading-6 text-date/65">Edit legal pages and last-updated dates shown in the public footer links.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="grid h-fit gap-2">
          {store.pages.map((item) => (
            <button
              key={item.slug}
              onClick={() => setSelectedSlug(item.slug)}
              className={`focus-ring rounded-md px-4 py-3 text-left text-sm font-semibold ${
                selectedSlug === item.slug ? "bg-date text-cream" : "bg-cream text-date/70"
              }`}
            >
              {item.title}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-date/70">
            Page title
            <input value={page.title} onChange={(event) => updatePage({ ...page, title: event.target.value })} className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold text-date/70">
            Summary
            <textarea value={page.summary} onChange={(event) => updatePage({ ...page, summary: event.target.value })} className="focus-ring mt-1 min-h-24 w-full rounded-md border border-date/15 px-4 py-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold text-date/70">
            Last updated
            <input type="date" value={page.lastUpdated} onChange={(event) => updatePage({ ...page, lastUpdated: event.target.value })} className="focus-ring mt-1 rounded-md border border-date/15 px-4 py-3 font-normal" />
          </label>

          <div className="space-y-4">
            {page.sections.map((section, index) => (
              <div key={`${page.slug}-${index}`} className="rounded-md border border-date/10 bg-cream p-4">
                <label className="block text-sm font-semibold text-date/70">
                  Section heading
                  <input
                    value={section.heading}
                    onChange={(event) => {
                      const sections = [...page.sections];
                      sections[index] = { ...section, heading: event.target.value };
                      updatePage({ ...page, sections });
                    }}
                    className="focus-ring mt-1 w-full rounded-md border border-date/15 bg-white px-4 py-3 font-normal"
                  />
                </label>
                <label className="mt-3 block text-sm font-semibold text-date/70">
                  Section text
                  <textarea
                    value={section.body}
                    onChange={(event) => {
                      const sections = [...page.sections];
                      sections[index] = { ...section, body: event.target.value };
                      updatePage({ ...page, sections });
                    }}
                    className="focus-ring mt-1 min-h-32 w-full rounded-md border border-date/15 bg-white px-4 py-3 font-normal"
                  />
                </label>
              </div>
            ))}
          </div>

          <button onClick={save} disabled={saving} className="focus-ring inline-flex items-center gap-2 rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-60">
            <Save size={17} /> {saving ? "Saving..." : "Save legal content"}
          </button>
          {message ? <p className="rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
