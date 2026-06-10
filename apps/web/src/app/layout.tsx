import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { businessInfo, openingHours } from "@saba/shared";
import { Footer } from "./Footer";
import { WebsiteEventTracker } from "./WebsiteEventTracker";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { readBusinessInfo } from "@/lib/businessInfoStore";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://sabacafe.co.uk");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Saba Cafe | Modern Somali Restaurant",
  description:
    "Order authentic Somali food from Saba Cafe at 152 Old Kent Rd, London SE1 5TY. Halal rice dishes, suqaar, sambusa, shaah, catering, pickup and delivery.",
  openGraph: {
    title: "Saba Cafe",
    description: "Warm, modern Somali cafe at 152 Old Kent Rd, London SE1 5TY for pickup, delivery, catering, and family dining.",
    images: ["/og-saba-cafe.jpg"]
  },
  keywords: ["Somali restaurant near me", "Somali food", "halal restaurant", "Saba Cafe", "bariis", "suqaar"]
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const footerInfo = await readBusinessInfo();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: footerInfo.businessName,
    telephone: footerInfo.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: footerInfo.address,
      addressCountry: businessInfo.address.country
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: businessInfo.googleRating,
      reviewCount: businessInfo.googleReviewCount
    },
    servesCuisine: ["Somali", "Halal", "East African"],
    priceRange: "££",
    acceptsReservations: "True",
    url: siteUrl,
    menu: `${siteUrl}/menu`,
    hasMap: businessInfo.googleMapsUrl,
    openingHoursSpecification: openingHours.map((row) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: row.day,
      opens: row.hours.split(" - ")[0],
      closes: row.hours.split(" - ")[1]
    })),
    sameAs: Object.values(footerInfo.socialLinks).filter(Boolean)
  };

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <WebsiteEventTracker />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <header className="sticky top-0 z-50 border-b border-date/10 bg-cream/95 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="focus-ring flex min-w-0 items-center gap-3 rounded-full pr-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-saffron/25 bg-white shadow-sm sm:h-11 sm:w-11">
                <img
                  src="/brand/saba-logo.jpeg"
                  alt="Saba Cafe logo"
                  className="h-full w-full object-contain p-1.5"
                />
              </span>
              <span className="truncate font-display text-xl font-semibold tracking-normal text-date sm:text-2xl">Saba Cafe</span>
            </Link>
            <div className="hidden items-center gap-6 text-sm font-medium text-date/75 md:flex">
              <Link href="/menu">Menu</Link>
              <Link href="/order">Order</Link>
              <Link href="/#reviews">Reviews</Link>
              <Link href="/#booking">Book</Link>
            </div>
            <Link
              href="/order"
              className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-date px-3 py-2 text-sm font-semibold text-cream shadow-soft sm:px-4"
            >
              <ShoppingBag size={16} className="shrink-0" />
              <span>Order<span className="hidden sm:inline"> Now</span></span>
            </Link>
          </nav>
          <div className="border-t border-date/10 md:hidden">
            <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 text-sm font-semibold text-date/75">
              {[
                ["Menu", "/menu"],
                ["Order", "/order"],
                ["Reviews", "/#reviews"],
                ["Book", "/#booking"],
                ["Contact", "/contact"]
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="focus-ring flex min-h-11 shrink-0 items-center rounded-full border border-date/10 bg-white px-4 transition hover:border-date/25 hover:text-date"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
        <Footer />
        <CookieConsentBanner text={footerInfo.cookieBannerText} />
        <Link
          href="/order"
          className="focus-ring fixed bottom-3 left-1/2 z-40 flex min-h-11 max-w-[calc(100%-2rem)] -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-mint px-5 py-3 text-sm font-semibold text-white shadow-soft md:hidden"
        >
          <ShoppingBag size={17} className="shrink-0" /> Order Now
        </Link>
      </body>
    </html>
  );
}
