import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BarChart3, CalendarDays, Clock, Gift, MessageSquare, Settings, ShoppingBag, Truck, Users, Utensils, Wrench } from "lucide-react";
import { AdminLogoutButton } from "./AdminLogoutButton";

const tools: [string, string, LucideIcon, string][] = [
  ["Overview", "Daily sales, live orders, bookings, menu status, and attention-needed items.", BarChart3, "/admin"],
  ["Menu", "Add dishes, edit every detail, save drafts, hide items, and publish to customers.", Utensils, "/admin/menu"],
  ["Orders", "Update received, preparing, ready, delivery, completed, and cancelled states.", ShoppingBag, "/admin/orders"],
  ["Bookings", "Manage tables, booking slots, blocked dates, approvals, and guest notes.", CalendarDays, "/admin/bookings"],
  ["Reviews", "Approve, hide, reply, and configure Google Review URL / Place ID.", MessageSquare, "/admin/reviews"],
  ["Opening hours", "Set trading hours, closures, and special opening messages.", Clock, "/admin/opening-hours"],
  ["Delivery settings", "Turn pickup/delivery on or off, set delivery radius, and set per-mile fees.", Truck, "/admin/settings"],
  ["Promo codes", "Create discounts, first-order offers, and campaign codes.", Gift, "/admin/promo-codes"],
  ["Customers", "View customers, order history, bookings, and review activity.", Users, "/admin/customers"],
  ["Website settings", "Manage homepage content, Google settings, contact details, and publishing.", Wrench, "/admin/website-settings"]
];

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-date p-8 text-cream">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Protected admin dashboard</p>
            <h1 className="mt-2 font-display text-5xl font-semibold">Saba Cafe operations centre.</h1>
            <p className="mt-4 max-w-3xl text-cream/75">Staff can manage live orders, menu publishing, delivery settings, reviews, and growth tools.</p>
          </div>
          <AdminLogoutButton />
        </div>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tools.map(([title, description, Icon, href]) => (
          <Link key={String(title)} href={String(href)} className="rounded-lg border border-date/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
            <Icon className="text-mint" size={28} />
            <h2 className="mt-4 font-display text-2xl font-semibold text-date">{String(title)}</h2>
            <p className="mt-2 text-sm leading-6 text-date/65">{String(description)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
