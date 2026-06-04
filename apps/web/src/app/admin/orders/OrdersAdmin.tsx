"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
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

export function OrdersAdmin({ initialOrderType = "ALL", kitchenMode = false }: { initialOrderType?: string; kitchenMode?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderType, setOrderType] = useState(initialOrderType);
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string> | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [latestNewOrder, setLatestNewOrder] = useState<Order | null>(null);
  const statuses = kitchenMode ? dineInStatuses : allStatuses;

  async function load() {
    const params = new URLSearchParams();
    if (orderType !== "ALL") params.set("orderType", orderType);
    if (paymentStatus !== "ALL") params.set("paymentStatus", paymentStatus);
    const response = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
    const data = await response.json();
    const nextOrders = (data.orders ?? []) as Order[];
    setOrders(nextOrders);
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
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await load();
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
    load();
    const interval = window.setInterval(load, 8000);
    return () => window.clearInterval(interval);
  }, [orderType, paymentStatus]);

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
              <button key={filter} onClick={() => setOrderType(filter)} className={`rounded-full px-4 py-2 text-sm font-semibold ${orderType === filter ? "bg-date text-cream" : "bg-cream text-date"}`}>
                {filter === "ALL" ? "All orders" : filter.replace("_", "-")}
              </button>
            ))
          )}
          {!kitchenMode ? paymentFilters.map((filter) => (
            <button key={filter} onClick={() => setPaymentStatus(filter)} className={`rounded-full px-4 py-2 text-sm font-semibold ${paymentStatus === filter ? "bg-mint text-white" : "bg-cream text-date"}`}>
              {filter === "PENDING_PAYMENT" ? "Pending counter payment" : filter}
            </button>
          )) : null}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-date/10 bg-white shadow-sm">
        <div className="grid bg-cream px-5 py-3 text-sm font-semibold text-date md:grid-cols-[1fr_150px_140px_180px]">
          <span>Order</span>
          <span>Payment</span>
          <span>Total</span>
          <span>Status</span>
        </div>
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id} className={`grid gap-4 border-t border-date/10 px-5 py-4 md:grid-cols-[1fr_170px_140px_180px] md:items-center ${kitchenMode ? "bg-saffron/10" : ""}`}>
              <div>
                <p className="font-semibold text-date">
                  {order.orderNumber} <span className="rounded-full bg-cream px-2 py-1 text-xs">{order.orderType.replace("_", "-")}</span>
                  {order.orderType === "DINE_IN" ? <span className="ml-2 rounded-full bg-mint/10 px-2 py-1 text-xs text-mint">Table {order.tableNumber}</span> : null}
                  {order.paymentMethod === "PAY_IN_STORE" || order.paymentStatus === "PENDING_PAYMENT" ? <span className="ml-2 rounded-full bg-saffron/20 px-2 py-1 text-xs text-clay">PAY AT COUNTER</span> : null}
                </p>
                <p className="text-sm text-date/60">{order.customerName ?? order.checkout.customerName} {order.customerPhone ? `• ${order.customerPhone}` : ""}</p>
                <p className="mt-1 text-sm text-date/60">{(order.items ?? order.checkout.items).map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                <p className="mt-1 text-xs text-date/45">Tracking {order.trackingCode}</p>
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
              <select className="focus-ring rounded-md border border-date/15 px-3 py-2" value={order.status ?? order.orderStatus} onChange={(event) => updateStatus(order.id, event.target.value)}>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          ))
        ) : (
          <p className="p-6 text-date/65">No real orders yet. Dine-in QR, collection, and delivery orders will appear here.</p>
        )}
      </div>
    </div>
  );
}
