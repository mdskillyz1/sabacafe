import Link from "next/link";
import type { LegalPageContent } from "@saba/shared";
import { legalNavigation } from "@/lib/legalContentStore";

export function LegalPageTemplate({ page }: { page: LegalPageContent }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_0.28fr]">
        <article className="rounded-lg border border-date/10 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Saba Cafe legal</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-date">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-date/70">{page.summary}</p>
          <p className="mt-4 text-sm font-semibold text-date/50">Last updated: {page.lastUpdated}</p>

          <div className="mt-10 space-y-8">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-3xl font-semibold text-date">{section.heading}</h2>
                <p className="mt-3 whitespace-pre-line leading-8 text-date/72">{section.body}</p>
              </section>
            ))}
          </div>
        </article>

        <aside className="h-fit rounded-lg border border-date/10 bg-cream p-5">
          <h2 className="font-display text-2xl font-semibold text-date">Legal pages</h2>
          <nav className="mt-4 grid gap-2 text-sm font-semibold text-date/70" aria-label="Legal pages">
            {legalNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 transition hover:bg-white hover:text-date">
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </main>
  );
}
