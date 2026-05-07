import { money } from "@saba/shared";
import { readBookingStore } from "./bookingStore";
import { getDemoOrders } from "./data";
import { readAdminActivity, readWebsiteEvents } from "./eventStore";
import { readMenuStore } from "./menuStore";

type RangePreset = "today" | "yesterday" | "last7" | "last30" | "month" | "custom";

type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

type AnalyticsOrder = Awaited<ReturnType<typeof getDemoOrders>>[number];

const orderStatuses = ["RECEIVED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"];
const bookingStatuses = ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "SEATED", "COMPLETED"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function resolveAnalyticsRange(searchParams: URLSearchParams): DateRange {
  const preset = (searchParams.get("range") || "today") as RangePreset;
  const now = new Date();

  if (preset === "yesterday") {
    const yesterday = addDays(now, -1);
    return { start: startOfDay(yesterday), end: endOfDay(yesterday), label: "Yesterday" };
  }
  if (preset === "last7") return { start: startOfDay(addDays(now, -6)), end: endOfDay(now), label: "Last 7 days" };
  if (preset === "last30") return { start: startOfDay(addDays(now, -29)), end: endOfDay(now), label: "Last 30 days" };
  if (preset === "month") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now), label: "This month" };
  if (preset === "custom") {
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (start && end) {
      return { start: startOfDay(new Date(start)), end: endOfDay(new Date(end)), label: "Custom range" };
    }
  }
  return { start: startOfDay(now), end: endOfDay(now), label: "Today" };
}

function inRange(value: string, range: DateRange) {
  const date = new Date(value);
  return date >= range.start && date <= range.end;
}

function previousRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 1);
  const start = new Date(end.getTime() - duration);
  return { start, end, label: "Previous period" };
}

function percentChange(current: number, previous: number) {
  if (!previous && !current) return "Not enough data yet";
  if (!previous) return "New activity";
  const value = ((current - previous) / previous) * 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}% vs previous period`;
}

function paidSales(orders: AnalyticsOrder[]) {
  return orders.filter((order) => order.paymentStatus === "PAID").reduce((sum, order) => sum + order.totals.totalPence, 0);
}

function groupByDate<T extends { createdAt: string }>(items: T[], range: DateRange, value: (item: T) => number) {
  const days: { label: string; value: number }[] = [];
  for (let date = startOfDay(range.start); date <= range.end; date = addDays(date, 1)) {
    const key = isoDate(date);
    days.push({
      label: key.slice(5),
      value: items.filter((item) => item.createdAt.startsWith(key)).reduce((sum, item) => sum + value(item), 0)
    });
  }
  return days;
}

function statusCounts(items: { status: string }[], statuses: string[]) {
  return statuses.map((status) => ({ label: status.replaceAll("_", " "), value: items.filter((item) => item.status === status).length }));
}

function hourCounts(items: { createdAt?: string; startTime?: string }[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const hour = item.startTime?.slice(0, 2) ?? (item.createdAt ? String(new Date(item.createdAt).getHours()).padStart(2, "0") : "");
    if (!hour) continue;
    counts.set(`${hour}:00`, (counts.get(`${hour}:00`) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label));
}

export async function getAnalytics(range: DateRange) {
  const previous = previousRange(range);
  const allOrders = await getDemoOrders();
  const bookingStore = await readBookingStore();
  const websiteStore = await readWebsiteEvents();
  const activityStore = await readAdminActivity();
  const menuStore = await readMenuStore();

  const orders = allOrders.filter((order) => inRange(order.createdAt, range));
  const previousOrders = allOrders.filter((order) => inRange(order.createdAt, previous));
  const bookings = bookingStore.bookings.filter((booking) => inRange(booking.createdAt, range));
  const previousBookings = bookingStore.bookings.filter((booking) => inRange(booking.createdAt, previous));
  const websiteEvents = websiteStore.events.filter((event) => inRange(event.createdAt, range));
  const previousWebsiteEvents = websiteStore.events.filter((event) => inRange(event.createdAt, previous));
  const staffActivity = activityStore.events.filter((event) => inRange(event.createdAt, range));

  const sales = paidSales(orders);
  const previousSales = paidSales(previousOrders);
  const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
  const completedOrders = orders.filter((order) => order.status === "COMPLETED");

  const topItems = orders
    .flatMap((order) =>
      order.checkout.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        revenuePence: item.quantity * (order.totals.subtotalPence / Math.max(1, order.checkout.items.reduce((sum, line) => sum + line.quantity, 0)))
      }))
    )
    .reduce<Record<string, { name: string; quantity: number; revenuePence: number }>>((acc, item) => {
      acc[item.name] = acc[item.name] ?? { name: item.name, quantity: 0, revenuePence: 0 };
      acc[item.name].quantity += item.quantity;
      acc[item.name].revenuePence += item.revenuePence;
      return acc;
    }, {});

  return {
    range: { start: isoDate(range.start), end: isoDate(range.end), label: range.label },
    kpis: {
      totalSales: { value: sales, display: money(sales), comparison: percentChange(sales, previousSales) },
      orders: { value: orders.length, comparison: percentChange(orders.length, previousOrders.length) },
      activeBookings: { value: bookings.filter((booking) => ["PENDING", "CONFIRMED", "SEATED"].includes(booking.status)).length, comparison: percentChange(bookings.length, previousBookings.length) },
      websiteVisits: { value: websiteEvents.filter((event) => event.type === "page_view").length, comparison: percentChange(websiteEvents.length, previousWebsiteEvents.length) },
      averageOrderValue: {
        value: paidOrders.length ? Math.round(sales / paidOrders.length) : 0,
        display: paidOrders.length ? money(Math.round(sales / paidOrders.length)) : "Not enough data yet"
      },
      pendingOrders: { value: orders.filter((order) => ["RECEIVED", "PREPARING"].includes(order.status)).length },
      pendingBookings: { value: bookings.filter((booking) => booking.status === "PENDING").length }
    },
    sales: {
      totalPence: sales,
      series: groupByDate(orders, range, (order) => (order.paymentStatus === "PAID" ? order.totals.totalPence : 0)),
      pickupRevenuePence: paidOrders.filter((order) => order.checkout.fulfilmentType === "PICKUP").reduce((sum, order) => sum + order.totals.totalPence, 0),
      deliveryRevenuePence: paidOrders.filter((order) => order.checkout.fulfilmentType === "DELIVERY").reduce((sum, order) => sum + order.totals.totalPence, 0),
      averageOrderTrend: groupByDate(paidOrders, range, (order) => order.totals.totalPence)
    },
    orders: {
      total: orders.length,
      byStatus: statusCounts(orders, orderStatuses),
      fulfilment: [
        { label: "Pickup", value: orders.filter((order) => order.checkout.fulfilmentType === "PICKUP").length },
        { label: "Delivery", value: orders.filter((order) => order.checkout.fulfilmentType === "DELIVERY").length }
      ],
      cancelled: orders.filter((order) => order.status === "CANCELLED").length,
      peakTimes: hourCounts(orders),
      recent: orders.slice(0, 8)
    },
    bookings: {
      total: bookings.length,
      today: bookingStore.bookings.filter((booking) => booking.date === isoDate(new Date())).length,
      upcoming: bookingStore.bookings.filter((booking) => booking.date >= isoDate(new Date())).slice(0, 8),
      byStatus: statusCounts(bookings, bookingStatuses),
      partySizes: bookings.map((booking) => ({ label: `${booking.partySize} guest${booking.partySize === 1 ? "" : "s"}`, value: 1 })),
      peakTimes: hourCounts(bookings),
      tableUtilisation: bookingStore.tables.map((table) => ({
        label: table.name,
        value: bookings.filter((booking) => booking.tableId === table.id).length
      }))
    },
    topSellers: {
      items: Object.values(topItems).sort((a, b) => b.quantity - a.quantity).slice(0, 8),
      categories: menuStore.categories.map((category) => ({
        label: category.name,
        value: menuStore.items.filter((item) => item.categoryId === category.id).length
      })),
      lowPerforming: menuStore.items
        .filter((item) => !Object.values(topItems).some((topItem) => topItem.name === item.name))
        .slice(0, 8)
        .map((item) => ({ name: item.name, quantity: 0, revenuePence: 0 }))
    },
    website: {
      pageViews: websiteEvents.filter((event) => event.type === "page_view").length,
      uniqueVisitors: new Set(websiteEvents.map((event) => event.sessionId).filter(Boolean)).size,
      menuViews: websiteEvents.filter((event) => event.type === "menu_view").length,
      orderPageViews: websiteEvents.filter((event) => event.type === "checkout_start").length,
      checkoutStarts: websiteEvents.filter((event) => event.type === "checkout_start").length,
      completedOrders: websiteEvents.filter((event) => event.type === "order_complete").length,
      conversionRate:
        websiteEvents.filter((event) => event.type === "checkout_start").length > 0
          ? Math.round((completedOrders.length / websiteEvents.filter((event) => event.type === "checkout_start").length) * 100)
          : null,
      bookingFormViews: websiteEvents.filter((event) => event.type === "booking_form_view").length,
      bookingCompletions: websiteEvents.filter((event) => event.type === "booking_submit").length,
      series: groupByDate(websiteEvents, range, () => 1)
    },
    staffActivity: {
      total: staffActivity.length,
      byType: Array.from(new Set(activityStore.events.map((event) => event.type))).map((type) => ({
        label: type.replaceAll("_", " "),
        value: staffActivity.filter((event) => event.type === type).length
      })),
      recent: staffActivity.slice(0, 12)
    },
    activityFeed: [
      ...orders.map((order) => ({ id: order.id, type: "order", message: `Order ${order.orderNumber} ${order.status.toLowerCase().replaceAll("_", " ")}`, createdAt: order.createdAt })),
      ...bookings.map((booking) => ({ id: booking.id, type: "booking", message: `Booking request for ${booking.partySize} guest${booking.partySize === 1 ? "" : "s"}`, createdAt: booking.createdAt })),
      ...staffActivity.map((event) => ({ id: event.id, type: "staff", message: event.message, createdAt: event.createdAt }))
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 14)
  };
}
