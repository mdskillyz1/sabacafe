"use client";

import { useEffect, useState } from "react";
import { money } from "@saba/shared";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  checkout: { customerName: string; fulfilmentType: string; items: { name: string; quantity: number }[] };
  totals: { totalPence: number };
  createdAt: string;
};

const statuses = ["RECEIVED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"];

export function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    const response = await fetch("/api/orders", { cache: "no-store" });
    const data = await response.json();
    setOrders(data.orders ?? []);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await load();
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 8000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-date/10 bg-white shadow-sm">
      <div className="grid bg-cream px-5 py-3 text-sm font-semibold text-date md:grid-cols-[1fr_130px_140px_180px]">
        <span>Order</span>
        <span>Payment</span>
        <span>Total</span>
        <span>Status</span>
      </div>
      {orders.length ? (
        orders.map((order) => (
          <div key={order.id} className="grid gap-4 border-t border-date/10 px-5 py-4 md:grid-cols-[1fr_130px_140px_180px] md:items-center">
            <div>
              <p className="font-semibold text-date">{order.orderNumber}</p>
              <p className="text-sm text-date/60">{order.checkout.customerName} • {order.checkout.fulfilmentType}</p>
              <p className="mt-1 text-sm text-date/60">{order.checkout.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
            </div>
            <span className="text-sm font-semibold text-mint">{order.paymentStatus}</span>
            <span className="font-semibold text-date">{money(order.totals.totalPence)}</span>
            <select className="focus-ring rounded-md border border-date/15 px-3 py-2" value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        ))
      ) : (
        <p className="p-6 text-date/65">No demo orders yet. Place an order from the customer flow to see it here.</p>
      )}
    </div>
  );
}
