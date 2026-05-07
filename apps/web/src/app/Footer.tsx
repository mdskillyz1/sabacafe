import Link from "next/link";
import { Instagram, Music2, ShieldCheck } from "lucide-react";
import { readBusinessInfo } from "@/lib/businessInfoStore";
import { legalNavigation } from "@/lib/legalContentStore";

export async function Footer() {
  const info = await readBusinessInfo();

  return (
    <footer className="border-t border-date/10 bg-[#f7efe1] px-4 py-10 text-date sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.15fr_0.85fr_0.85fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-saffron/25 bg-white shadow-sm">
              <img src="/brand/saba-logo.jpeg" alt="" className="h-full w-full object-contain p-1.5" />
            </span>
            <p className="font-display text-2xl font-semibold">{info.businessName}</p>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-date/65">
            Fresh, family-owned, authentic Somali food for pickup, delivery, catering, and cosy tables on Old Kent Road.
          </p>
          <p className="mt-5 text-sm text-date/55">{info.copyrightText}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-clay">Contact</h2>
          <address className="mt-4 space-y-2 not-italic text-sm leading-6 text-date/70">
            <p>{info.address}</p>
            <p>
              <a className="transition hover:text-date" href={`mailto:${info.email}`}>{info.email}</a>
            </p>
            <p>
              <a className="transition hover:text-date" href={`tel:${info.phone.replace(/[^\d+]/g, "")}`}>{info.phone}</a>
            </p>
            {info.openingHoursText ? <p>{info.openingHoursText}</p> : null}
          </address>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-clay">Quick links</h2>
          <nav className="mt-4 grid grid-cols-2 gap-2 text-sm text-date/70" aria-label="Footer navigation">
            <Link className="transition hover:text-date" href="/menu">Menu</Link>
            <Link className="transition hover:text-date" href="/order">Order</Link>
            <Link className="transition hover:text-date" href="/#booking">Book</Link>
            <Link className="transition hover:text-date" href="/contact">Contact</Link>
          </nav>
          <div className="mt-5 flex items-center gap-3">
            {info.socialLinks.instagram ? (
              <a className="focus-ring rounded-full bg-white p-2 text-date shadow-sm transition hover:text-clay" href={info.socialLinks.instagram} aria-label="Instagram">
                <Instagram size={18} />
              </a>
            ) : null}
            {info.socialLinks.tiktok ? (
              <a className="focus-ring rounded-full bg-white p-2 text-date shadow-sm transition hover:text-clay" href={info.socialLinks.tiktok} aria-label="TikTok">
                <Music2 size={18} />
              </a>
            ) : null}
            <Link className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-date/35 transition hover:text-date/60" href="/admin">
              <ShieldCheck size={14} /> Staff
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-clay">Legal</h2>
          <nav className="mt-4 grid gap-2 text-sm text-date/70" aria-label="Legal navigation">
            {legalNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-date">
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
