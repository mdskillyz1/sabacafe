"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, ChefHat, Clock, Flame, X } from "lucide-react";
import { money } from "@saba/shared";

type Order = {
  id: string;
  orderNumber: string;
  trackingCode: string;
  orderType: string;
  tableNumber?: string;
  status: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerPhone?: string;
  checkout: { customerName: string; fulfilmentType: string; items: { name: string; quantity: number }[] };
  items: { name: string; quantity: number; notes?: string }[];
  totals: { totalPence: number };
  totalPence: number;
  createdAt: string;
};

const allStatuses = ["RECEIVED", "ACCEPTED", "PREPARING", "READY", "READY_FOR_PICKUP", "SERVED", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"];
const dineInStatuses = ["RECEIVED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];
const orderFilters = ["ALL", "DINE_IN", "COLLECTION", "DELIVERY"];
const paymentFilters = ["ALL", "PENDING_PAYMENT", "PAID", "PAY_IN_STORE", "PENDING", "FAILED", "REFUNDED"];
const statusFilters = ["ALL", "RECEIVED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];

function nextKitchenAction(status: string) {
  if (status === "RECEIVED") return { next: "PREPARING", label: "Start preparing", icon: Flame, tone: "bg-date text-cream" };
  if (status === "PREPARING") return { next: "READY", label: "Mark ready", icon: ChefHat, tone: "bg-saffron text-date" };
  if (status === "READY") return { next: "SERVED", label: "Mark served", icon: CheckCircle2, tone: "bg-mint text-white" };
  if (status === "SERVED") return { next: "COMPLETED", label: "Complete", icon: CheckCircle2, tone: "bg-date text-cream" };
  return null;
}

export function OrdersAdmin({ initialOrderType = "ALL", kitchenMode = false }: { initialOrderType?: string; kitchenMode?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderType, setOrderType] = useState(initialOrderType);
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string> | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [latestNewOrder, setLatestNewOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [exitingOrderIds, setExitingOrderIds] = useState<Set<string>>(new Set());
  const statuses = kitchenMode ? dineInStatuses : allStatuses;

  async function load() {
    const params = new URLSearchParams();
    if (orderType !== "ALL") params.set("orderType", orderType);
    if (paymentStatus !== "ALL") params.set("paymentStatus", paymentStatus);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const response = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
    const data = await response.json();
    const nextOrders = (data.orders ?? []) as Order[];
    setOrders(kitchenMode ? nextOrders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status ?? order.orderStatus)) : nextOrders);
    setKnownOrderIds((current) => {
      const nextIds = new Set(nextOrders.map((order) => order.id));
      if (!current) return nextIds;
      const freshOrders = nextOrders.filter((order) => !current.has(order.id));
      if (freshOrders.length) {
        setNewOrderCount((count) => count + freshOrders.length);
        setLatestNewOrder(freshOrders[0]);
      }
      return nextIds;
    });
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingOrderId(id);
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (kitchenMode && ["COMPLETED", "CANCELLED"].includes(status)) {
      setExitingOrderIds((current) => new Set(current).add(id));
      window.setTimeout(async () => {
        await load();
        setExitingOrderIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        setUpdatingOrderId(null);
      }, 420);
      return;
    }
    await load();
    window.setTimeout(() => setUpdatingOrderId(null), 250);
  }

  async function updatePaymentStatus(id: string, paymentStatus: string) {
    await fetch(`/api/admin/orders/${id}/payment-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus })
    });
    await load();
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderType(params.get("orderType") ?? initialOrderType);
    setPaymentStatus(params.get("paymentStatus") ?? "ALL");
    setStatusFilter(params.get("status") ?? "ALL");
  }, [initialOrderType]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 8000);
    return () => window.clearInterval(interval);
  }, [orderType, paymentStatus, statusFilter]);

  useEffect(() => {
    const originalTitle = document.title;
    if (newOrderCount > 0) {
      document.title = `(${newOrderCount}) New order - Saba Cafe`;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [newOrderCount]);

  return (
    <div className="mt-8 space-y-5">
      {newOrderCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-mint/20 bg-mint/10 p-4 text-date shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-white">
              <Bell size={18} />
            </span>
            <div>
              <p className="font-semibold text-date">
                {newOrderCount} new order{newOrderCount === 1 ? "" : "s"} received
              </p>
              <p className="mt-1 text-sm text-date/65">
                {latestNewOrder
                  ? `${latestNewOrder.orderNumber}${latestNewOrder.tableNumber ? ` from table ${latestNewOrder.tableNumber}` : ""} is waiting in Orders.`
                  : "Open Orders or Kitchen to review it."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewOrderCount(0);
              setLatestNewOrder(null);
            }}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-date"
          >
            <X size={15} /> Clear
          </button>
        </div>
      ) : null}
      <div className="rounded-lg border border-date/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {kitchenMode ? (
            <span className="rounded-full bg-date px-4 py-2 text-sm font-semibold text-cream">Dine-in kitchen view</span>
          ) : (
            orderFilters.map((filter) => (
              <button key={filter} onClick={() => setOrderType(filter)} className={`saba-status-button rounded-full px-4 py-2 text-sm font-semibold transition hover:scale-[1.03] active:scale-[0.98] ${orderType === filter ? "bg-date text-cream" : "bg-cream text-date"}`}>
                {filter === "ALL" ? "All orders" : filter.replace("_", "-")}
              </button>
            ))
          )}
          {!kitchenMode ? paymentFilters.map((filter) => (
            <button key={filter} onClick={() => setPaymentStatus(filter)} className={`saba-status-button rounded-full px-4 py-2 text-sm font-semibold transition hover:scale-[1.03] active:scale-[0.98] ${paymentStatus === filter ? "bg-mint text-white" : "bg-cream text-date"}`}>
              {filter === "PENDING_PAYMENT" ? "Pending counter payment" : filter}
            </button>
          )) : null}
          {!kitchenMode ? statusFilters.map((filter) => (
            <button key={filter} onClick={() => setStatusFilter(filter)} className={`saba-status-button rounded-full px-4 py-2 text-sm font-semibold transition hover:scale-[1.03] active:scale-[0.98] ${statusFilter === filter ? "bg-saffron text-date" : "bg-cream text-date"}`}>
              {filter === "ALL" ? "All statuses" : filter.replaceAll("_", " ")}
            </button>
          )) : null}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-date/10 bg-white shadow-sm">
        <div className="grid bg-cream px-5 py-3 text-sm font-semibold text-date md:grid-cols-[1fr_170px_120px_220px]">
          <span>Order</span>
          <span>Payment</span>
          <span>Total</span>
          <span>{kitchenMode ? "Kitchen action" : "Status"}</span>
        </div>
        {orders.length ? (
          orders.map((order) => {
            const currentStatus = order.status ?? order.orderStatus;
            const action = nextKitchenAction(currentStatus);
            const ActionIcon = action?.icon ?? Clock;
            const isUpdating = updatingOrderId === order.id;
            const isExiting = exitingOrderIds.has(order.id);
            return (
              <div
                key={order.id}
                className={`saba-order-enter grid gap-4 border-t border-date/10 px-5 py-4 transition duration-300 md:grid-cols-[1fr_170px_120px_220px] md:items-center ${
                  kitchenMode ? "bg-saffron/10" : ""
                } ${isUpdating ? "saba-order-handling ring-2 ring-mint/30" : ""} ${isExiting ? "saba-order-exit" : ""}`}
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-date">
                    <span>{order.orderNumber}</span>
                    <span className="rounded-full bg-cream px-2 py-1 text-xs">{order.orderType.replace("_", "-")}</span>
                    {order.orderType === "DINE_IN" ? <span className="rounded-full bg-mint/10 px-2 py-1 text-xs text-mint">Table {order.tableNumber}</span> : null}
                    {order.paymentMethod === "PAY_IN_STORE" || order.paymentStatus === "PENDING_PAYMENT" ? <span className="rounded-full bg-saffron/20 px-2 py-1 text-xs text-clay">PAY AT COUNTER</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-date/60">{order.customerName ?? order.checkout.customerName} {order.customerPhone ? `• ${order.customerPhone}` : ""}</p>
                  <div className={`mt-3 rounded-lg border p-3 ${kitchenMode ? "border-mint/20 bg-white" : "border-date/10 bg-cream/70"}`}>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-clay">
                      <ChefHat size={14} /> Food order
                    </p>
                    <div className="space-y-2">
                      {(order.items ?? order.checkout.items).map((item) => (
                        <div key={`${order.id}-${item.name}`} className="flex justify-between gap-3 rounded-md bg-cream px-3 py-2 text-sm">
                          <span className="font-semibold text-date">{item.quantity}x {item.name}</span>
                          {item.notes ? <span className="text-date/55">{item.notes}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-date/45">Tracking {order.trackingCode}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-mint">{order.paymentStatus === "PENDING_PAYMENT" ? "Pending counter payment" : order.paymentStatus}</span>
                  <p className="text-xs text-date/55">{order.paymentMethod.replaceAll("_", " ")}</p>
                  {!kitchenMode ? (
                    <select className="focus-ring mt-2 w-full rounded-md border border-date/15 px-2 py-1 text-xs" value={order.paymentStatus} onChange={(event) => updatePaymentStatus(order.id, event.target.value)}>
                      {paymentFilters.filter((status) => status !== "ALL").map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  ) : null}
                </div>
                <span className="font-semibold text-date">{money(order.totalPence ?? order.totals.totalPence)}</span>
                {kitchenMode ? (
                  <div className="space-y-2">
                    <span className="block rounded-full bg-cream px-3 py-2 text-center text-xs font-semibold text-date">{currentStatus.replaceAll("_", " ")}</span>
                    {action ? (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(order.id, action.next)}
                        className={`saba-status-button focus-ring flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 ${action.tone}`}
                      >
                        <ActionIcon size={17} className={isUpdating ? "animate-spin" : ""} />
                        {isUpdating ? "Handling..." : action.label}
                      </button>
                    ) : null}
                    <button type="button" onClick={() => updateStatus(order.id, "CANCELLED")} className="saba-status-button focus-ring w-full rounded-full border border-date/15 px-4 py-2 text-sm font-semibold text-date transition active:scale-[0.98]">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select className="focus-ring rounded-md border border-date/15 px-3 py-2" value={currentStatus} onChange={(event) => updateStatus(order.id, event.target.value)}>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })
        ) : (
          <p className="p-6 text-date/65">{kitchenMode ? "No live kitchen orders. Completed and cancelled orders are removed from this live view." : "No real orders yet. Dine-in QR, collection, and delivery orders will appear here."}</p>
        )}
      </div>
    </div>
  );
}
