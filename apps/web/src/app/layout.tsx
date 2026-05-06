import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { businessInfo, openingHours } from "@saba/shared";
import { Footer } from "./Footer";
import { readBusinessInfo } from "@/lib/businessInfoStore";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <header className="sticky top-0 z-50 border-b border-date/10 bg-cream/92 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="focus-ring flex items-center gap-3 rounded-full pr-2">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-saffron/25 bg-white shadow-sm">
                <img
                  src="/brand/saba-logo.jpeg"
                  alt="Saba Cafe logo"
                  className="h-full w-full object-contain p-1.5"
                />
              </span>
              <span className="font-display text-2xl font-semibold tracking-normal text-date">Saba Cafe</span>
            </Link>
            <div className="hidden items-center gap-6 text-sm font-medium text-date/75 md:flex">
              <Link href="/menu">Menu</Link>
              <Link href="/order">Order</Link>
              <Link href="/#reviews">Reviews</Link>
              <Link href="/#booking">Book</Link>
            </div>
            <Link
              href="/order"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-date px-4 py-2 text-sm font-semibold text-cream shadow-soft"
            >
              <ShoppingBag size={17} /> Order Now
            </Link>
          </nav>
        </header>
        {children}
        <Footer />
        <Link
          href="/order"
          className="focus-ring fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-full bg-mint px-5 py-4 font-semibold text-white shadow-soft md:hidden"
        >
          <ShoppingBag size={18} /> Order Saba Cafe
        </Link>
      </body>
    </html>
  );
}
