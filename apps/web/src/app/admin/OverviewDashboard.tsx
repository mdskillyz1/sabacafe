"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock,
  CreditCard,
  LineChart,
  MousePointerClick,
  PackageSearch,
  PoundSterling,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users
} from "lucide-react";
import { money } from "@saba/shared";
import { AdminLogoutButton } from "./AdminLogoutButton";

type Analytics = any;

const rangeOptions = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["last7", "Last 7 days"],
  ["last30", "Last 30 days"],
  ["month", "This month"],
  ["custom", "Custom"]
];

const kpiIcons = [PoundSterling, TrendingUp, CalendarDays, MousePointerClick, CreditCard, ShoppingBag, Clock, Users];
const adminLinks = [
  ["Menu", "/admin/menu"],
  ["Orders", "/admin/orders"],
  ["Bookings", "/admin/bookings"],
  ["Reviews", "/admin/reviews"],
  ["Delivery", "/admin/settings"],
  ["Website", "/admin/website-settings"],
  ["Admin users", "/admin/users"]
];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-date/15 bg-cream/55 p-6 text-center text-sm font-semibold text-date/55">
      {message}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-date">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function BarChart({ data, empty }: { data: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(...data.map((item) => item.value), 0);
  if (!max) return <EmptyState message={empty} />;
  return (
    <div className="flex h-56 items-end gap-2 border-b border-date/10 pb-2">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-44 w-full items-end rounded-md bg-cream">
            <div className="w-full rounded-md bg-mint" style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-date/50">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineTrend({ data, empty }: { data: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(...data.map((item) => item.value), 0);
  if (!max) return <EmptyState message={empty} />;
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / max) * 90;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div>
      <svg viewBox="0 0 100 110" className="h-56 w-full overflow-visible">
        <polyline points={points} fill="none" stroke="#1e7a68" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.split(" ").map((point, index) => {
          const [cx, cy] = point.split(",");
          return <circle key={index} cx={cx} cy={cy} r="2.5" fill="#d9902a" />;
        })}
      </svg>
      <div className="flex justify-between text-[11px] font-semibold text-date/50">
        <span>{data[0]?.label}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  );
}

function DonutList({ data, empty }: { data: { label: string; value: number }[]; empty: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <EmptyState message={empty} />;
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm font-semibold text-date">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-cream">
            <div className="h-2 rounded-full bg-saffron" style={{ width: `${(item.value / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatNumber(value: number | string) {
  return typeof value === "number" ? value.toLocaleString("en-GB") : value;
}

export function OverviewDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [range, setRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams({ range });
    if (range === "custom") {
      if (customStart) params.set("start", customStart);
      if (customEnd) params.set("end", customEnd);
    }
    return params.toString();
  }, [range, customStart, customEnd]);

  async function load() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/admin/analytics/overview?${query}`, { cache: "no-store" });
    const body = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok || !body) {
      setError(body?.error ?? "Unable to load analytics.");
      return;
    }
    setAnalytics(body);
  }

  useEffect(() => {
    load();
  }, [query]);

  const kpis = analytics
    ? [
        ["Sales", analytics.kpis.totalSales.display, analytics.kpis.totalSales.comparison, "bg-mint/10 text-mint"],
        ["Orders", analytics.kpis.orders.value, analytics.kpis.orders.comparison, "bg-saffron/15 text-clay"],
        ["Active bookings", analytics.kpis.activeBookings.value, analytics.kpis.activeBookings.comparison, "bg-date/10 text-date"],
        ["Website visits", analytics.kpis.websiteVisits.value, analytics.kpis.websiteVisits.comparison, "bg-mint/10 text-mint"],
        ["Average order value", analytics.kpis.averageOrderValue.display, "Not enough data yet", "bg-saffron/15 text-clay"],
        ["Pending orders", analytics.kpis.pendingOrders.value, "Needs attention", "bg-red-50 text-red-700"],
        ["Pending bookings", analytics.kpis.pendingBookings.value, "Needs review", "bg-red-50 text-red-700"],
        ["Completed orders", analytics.website.completedOrders, "Real conversions only", "bg-date/10 text-date"]
      ]
    : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-date p-6 text-cream shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Executive overview</p>
            <h1 className="mt-2 font-display text-5xl font-semibold">Saba Cafe business dashboard.</h1>
            <p className="mt-3 max-w-3xl text-cream/70">Real orders, bookings, website events, and admin activity. No mock analytics are shown.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="focus-ring inline-flex items-center gap-2 rounded-full border border-cream/20 px-4 py-2 text-sm font-semibold text-cream">
              <RefreshCw size={16} /> Refresh
            </button>
            <AdminLogoutButton />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-date/10 bg-white p-4 shadow-sm">
        <div className="mr-auto flex flex-wrap gap-2">
          {adminLinks.map(([label, href]) => (
            <Link key={href} href={href} className="focus-ring rounded-full bg-cream px-3 py-2 text-sm font-semibold text-date/70 hover:text-date">
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-date/10 bg-white p-4 shadow-sm">
        {rangeOptions.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setRange(value)}
            className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold ${range === value ? "bg-date text-cream" : "bg-cream text-date/70"}`}
          >
            {label}
          </button>
        ))}
        {range === "custom" ? (
          <>
            <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="focus-ring rounded-md border border-date/15 px-3 py-2 text-sm" />
            <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="focus-ring rounded-md border border-date/15 px-3 py-2 text-sm" />
          </>
        ) : null}
      </div>

      {error ? <p className="mt-6 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {loading && !analytics ? <p className="mt-6 rounded-lg border border-date/10 bg-white p-6 text-date/65">Loading business analytics...</p> : null}

      {analytics ? (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(([label, value, comparison, tone], index) => {
              const Icon = kpiIcons[index] ?? Activity;
              return (
                <div key={label} className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <p className="text-sm font-semibold text-date/55">{label}</p>
                      <p className="mt-2 font-display text-3xl font-semibold text-date">{formatNumber(value)}</p>
                    </span>
                    <span className={`rounded-full p-2 ${tone}`}>
                      <Icon size={20} />
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-date/50">{comparison}</p>
                </div>
              );
            })}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <Panel title="Sales over time" action={<LineChart className="text-mint" size={22} />}>
              <LineTrend data={analytics.sales.series} empty="No sales yet" />
            </Panel>
            <Panel title="Pickup vs delivery revenue">
              <DonutList
                data={[
                  { label: "Pickup", value: analytics.sales.pickupRevenuePence },
                  { label: "Delivery", value: analytics.sales.deliveryRevenuePence }
                ]}
                empty="No paid revenue yet"
              />
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-cream p-3">
                  <p className="text-date/55">Pickup revenue</p>
                  <p className="font-semibold text-date">{money(analytics.sales.pickupRevenuePence)}</p>
                </div>
                <div className="rounded-md bg-cream p-3">
                  <p className="text-date/55">Delivery revenue</p>
                  <p className="font-semibold text-date">{money(analytics.sales.deliveryRevenuePence)}</p>
                </div>
              </div>
            </Panel>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <Panel title="Orders by status">
              <DonutList data={analytics.orders.byStatus} empty="No orders yet" />
            </Panel>
            <Panel title="Bookings by status">
              <DonutList data={analytics.bookings.byStatus} empty="No bookings yet" />
            </Panel>
            <Panel title="Website performance">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Page visits", analytics.website.pageViews],
                  ["Unique visitors", analytics.website.uniqueVisitors || "Not enough data yet"],
                  ["Menu views", analytics.website.menuViews],
                  ["Order views", analytics.website.orderPageViews],
                  ["Checkout starts", analytics.website.checkoutStarts],
                  ["Completed orders", analytics.website.completedOrders],
                  ["Booking views", analytics.website.bookingFormViews],
                  ["Booking submits", analytics.website.bookingCompletions]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-cream p-3">
                    <p className="text-date/55">{label}</p>
                    <p className="font-semibold text-date">{formatNumber(value)}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel title="Peak order times" action={<BarChart3 className="text-mint" size={22} />}>
              <BarChart data={analytics.orders.peakTimes} empty="No order time data yet" />
            </Panel>
            <Panel title="Recent orders">
              {analytics.orders.recent.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-date/50">
                      <tr><th className="py-2">Order</th><th>Total</th><th>Payment</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {analytics.orders.recent.map((order: any) => (
                        <tr key={order.id} className="border-t border-date/10">
                          <td className="py-3 font-semibold text-date">{order.orderNumber}</td>
                          <td>{money(order.totals.totalPence)}</td>
                          <td>{order.paymentStatus}</td>
                          <td>{order.status.replaceAll("_", " ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState message="No orders yet" />}
            </Panel>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <Panel title="Top-selling items">
              {analytics.topSellers.items.length ? (
                <div className="space-y-3">
                  {analytics.topSellers.items.map((item: any) => (
                    <div key={item.name} className="rounded-md bg-cream p-3">
                      <p className="font-semibold text-date">{item.name}</p>
                      <p className="text-sm text-date/60">{item.quantity} sold • {money(Math.round(item.revenuePence))}</p>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="Top-selling items will appear once orders are completed" />}
            </Panel>
            <Panel title="Upcoming bookings">
              {analytics.bookings.upcoming.length ? (
                <div className="space-y-3">
                  {analytics.bookings.upcoming.map((booking: any) => (
                    <div key={booking.id} className="rounded-md bg-cream p-3">
                      <p className="font-semibold text-date">{booking.customerName}</p>
                      <p className="text-sm text-date/60">{booking.date} at {booking.startTime} • {booking.partySize} guests • {booking.status}</p>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No upcoming bookings yet" />}
            </Panel>
            <Panel title="Table utilisation">
              <DonutList data={analytics.bookings.tableUtilisation} empty="No table utilisation yet" />
            </Panel>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Panel title="Staff operations">
              <DonutList data={analytics.staffActivity.byType} empty="No staff activity yet" />
            </Panel>
            <Panel title="Recent activity feed">
              {analytics.activityFeed.length ? (
                <div className="space-y-3">
                  {analytics.activityFeed.map((event: any) => (
                    <div key={`${event.type}-${event.id}`} className="flex gap-3 rounded-md bg-cream p-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-mint" />
                      <div>
                        <p className="text-sm font-semibold text-date">{event.message}</p>
                        <p className="text-xs text-date/50">{new Date(event.createdAt).toLocaleString("en-GB")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No staff activity yet" />}
            </Panel>
          </section>
        </>
      ) : null}
    </main>
  );
}
