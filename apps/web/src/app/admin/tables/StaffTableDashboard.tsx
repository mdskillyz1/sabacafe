"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, ReceiptText, RefreshCw, Search, Send, Table2, Trash2 } from "lucide-react";
import { MenuCard } from "@/components/MenuCard";
import { calculatePrice, money, type CartLine, type MenuItem } from "@saba/shared";

type TableRecord = { id: string; name: string; capacity: number; active: boolean };
type OrderRecord = {
  id: string;
  orderNumber: string;
  tableId?: string;
  tableNumber?: string;
  customerName?: string;
  paymentStatus: string;
  status: string;
  orderStatus?: string;
  totalPence: number;
  totals: { totalPence: number };
  items?: CartLine[];
  checkout: { items: CartLine[] };
};
type AdminRole = "SUPER_ADMIN" | "MANAGER" | "STAFF" | "KITCHEN";

function statusLabel(order?: OrderRecord, draftCount = 0) {
  if (draftCount) return "Ordering";
  if (!order) return "Available";
  if (order.paymentStatus === "PAID" && order.status === "COMPLETED") return "Paid";
  if (order.status === "READY") return "Ready";
  if (["RECEIVED", "ACCEPTED", "PREPARING"].includes(order.status)) return "Sent to Kitchen";
  return order.status.replaceAll("_", " ");
}

function optionDelta(item: MenuItem | undefined, line: CartLine) {
  return line.optionIds.reduce((sum, optionId) => sum + (item?.options.find((option) => option.id === optionId)?.priceDeltaPence ?? 0), 0);
}

export function StaffTableDashboard() {
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [currentRole, setCurrentRole] = useState<AdminRole>("STAFF");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const activeOrders = orders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status ?? order.orderStatus));
  const selectedOrder = selectedTable ? activeOrders.find((order) => order.tableId === selectedTable.id || order.tableNumber === selectedTable.name) : undefined;
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => item.available && item.published && !item.hidden && (!term || item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term))).slice(0, 12);
  }, [items, search]);
  const totals = calculatePrice(cart, items, "PICKUP", "", 0.2, 0, 0);

  async function load() {
    setLoading(true);
    const [tableResponse, orderResponse, menuResponse] = await Promise.all([
      fetch("/api/admin/tables", { cache: "no-store" }),
      fetch("/api/admin/orders?orderType=DINE_IN", { cache: "no-store" }),
      fetch("/api/menu", { cache: "no-store" })
    ]);
    const [tableBody, orderBody, menuBody] = await Promise.all([tableResponse.json(), orderResponse.json(), menuResponse.json()]);
    setTables((tableBody.tables ?? []).filter((table: TableRecord) => table.active));
    setOrders(orderBody.orders ?? []);
    setItems(menuBody.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setCurrentRole(body.user?.role ?? "STAFF"))
      .catch(() => setCurrentRole("STAFF"));
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);

  function addItem(item: MenuItem, optionIds: string[] = [], optionLabels: string[] = [], notes = "") {
    const nextLine = {
      menuItemId: item.id,
      name: item.name,
      unitPricePence: item.pricePence,
      quantity: 1,
      optionIds,
      optionLabels,
      addOnIds: [],
      notes
    };
    setCart((current) => {
      const existingItems = selectedOrder?.items ?? selectedOrder?.checkout.items ?? [];
      const base = selectedOrder && !current.length ? existingItems : current;
      return [...base, nextLine];
    });
    setNotice(`${item.name} added.`);
  }

  function changeQuantity(index: number, delta: number) {
    setCart((current) =>
      current
        .map((line, lineIndex) => (lineIndex === index ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  async function sendToKitchen() {
    if (!selectedTable) return;
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch(selectedOrder ? `/api/admin/staff-orders/${selectedOrder.id}` : "/api/admin/staff-orders", {
      method: selectedOrder ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedOrder ? { items: cart } : { tableId: selectedTable.id, tableNumber: selectedTable.name, customerName, items: cart })
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "Order could not be sent.");
      return;
    }
    setCart([]);
    setCustomerName("");
    setNotice(selectedOrder ? `${body.orderNumber} updated.` : `${body.orderNumber} sent to kitchen.`);
    await load();
  }

  function startAmendOrder(order: OrderRecord) {
    setSelectedTableId(tables.find((table) => table.id === order.tableId || table.name === order.tableNumber)?.id ?? selectedTableId);
    setCart([...(order.items ?? order.checkout.items ?? [])]);
    setCustomerName(order.customerName ?? "");
    setNotice(`${order.orderNumber} is ready to amend. Save changes when finished.`);
  }

  async function patchOrder(order: OrderRecord, path: string, body: object, message: string) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/orders/${order.id}/${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Order could not be updated.");
      return;
    }
    setNotice(message);
    await load();
  }

  async function clearTable(order: OrderRecord) {
    await patchOrder(order, "status", { status: "COMPLETED" }, `${order.tableNumber} cleared.`);
  }

  if (loading) return <p className="rounded-lg border border-date/10 bg-white p-6 text-date/65">Loading table dashboard...</p>;

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-semibold text-date">Tables</h2>
              <p className="mt-1 text-sm text-date/60">Tap a table to build or manage an order.</p>
            </div>
            <button onClick={load} className="focus-ring inline-flex items-center gap-2 rounded-full border border-date/15 px-4 py-2 text-sm font-semibold text-date">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tables.map((table) => {
              const order = activeOrders.find((row) => row.tableId === table.id || row.tableNumber === table.name);
              const isSelected = selectedTableId === table.id;
              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`focus-ring rounded-lg border p-4 text-left transition ${isSelected ? "border-mint bg-mint/10" : "border-date/10 bg-cream/70 hover:border-mint/40"}`}
                >
                  <span className="flex items-center gap-2 font-display text-2xl font-semibold text-date"><Table2 size={18} /> {table.name}</span>
                  <span className="mt-3 block text-sm font-semibold text-clay">{statusLabel(order, isSelected ? cart.length : 0)}</span>
                  <span className="mt-1 block text-sm text-date/60">{order ? money(order.totalPence ?? order.totals.totalPence) : "No active order"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
          <h2 className="font-display text-3xl font-semibold text-date">{selectedTable ? selectedTable.name : "Select a table"}</h2>
          {selectedOrder ? (
            <div className="mt-4 rounded-lg border border-saffron/25 bg-saffron/10 p-4">
              <p className="font-semibold text-date">{selectedOrder.orderNumber} • {statusLabel(selectedOrder)}</p>
              <p className="mt-1 text-sm text-date/65">Total {money(selectedOrder.totalPence ?? selectedOrder.totals.totalPence)} • Payment {selectedOrder.paymentStatus}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => startAmendOrder(selectedOrder)} className="focus-ring rounded-full border border-date/15 bg-white px-4 py-2 text-sm font-semibold text-date">Amend Order</button>
                {currentRole !== "STAFF" ? (
                  <>
                    <button onClick={() => patchOrder(selectedOrder, "status", { status: "PREPARING" }, "Order marked preparing.")} className="focus-ring rounded-full bg-date px-4 py-2 text-sm font-semibold text-cream">Preparing</button>
                    <button onClick={() => patchOrder(selectedOrder, "status", { status: "READY" }, "Order marked ready.")} className="focus-ring rounded-full bg-mint px-4 py-2 text-sm font-semibold text-white">Ready</button>
                  </>
                ) : null}
                <button onClick={() => patchOrder(selectedOrder, "payment-status", { paymentStatus: "PAID" }, "Payment marked paid.")} className="focus-ring rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-date">Mark Paid</button>
                <button onClick={() => clearTable(selectedOrder)} className="focus-ring rounded-full border border-date/15 px-4 py-2 text-sm font-semibold text-date">Clear Table</button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-date/60">No active order on this table.</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
          <h2 className="font-display text-3xl font-semibold text-date">Create table order</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer name optional" className="focus-ring rounded-md border border-date/15 px-4 py-3" />
            <label className="flex items-center gap-2 rounded-md border border-date/15 px-4 py-3">
              <Search size={17} className="text-date/45" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu item" className="w-full border-0 bg-transparent outline-none" />
            </label>
          </div>
          <div className="mt-5 grid max-h-[32rem] gap-4 overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} onAdd={addItem} compact quantity={cart.filter((line) => line.menuItemId === item.id).length} />
            ))}
          </div>
        </div>

        <div className="sticky top-20 rounded-lg border border-date/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold text-date">Current order</h2>
            <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold text-date">{money(totals.totalPence)}</span>
          </div>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {cart.length ? cart.map((line, index) => {
              const item = items.find((candidate) => candidate.id === line.menuItemId);
              return (
                <div key={`${line.menuItemId}-${index}`} className="rounded-md border border-date/10 bg-cream/70 p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-date">{line.name}</p>
                      <p className="text-sm text-date/60">{money(line.unitPricePence + optionDelta(item, line))} each</p>
                      {line.optionLabels?.length ? <p className="mt-1 text-xs font-semibold text-clay">{line.optionLabels.join(" • ")}</p> : null}
                      {line.notes ? <p className="mt-1 text-xs text-date/55">Note: {line.notes}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQuantity(index, -1)} className="focus-ring rounded-full border border-date/15 p-1"><Minus size={14} /></button>
                      <span className="w-5 text-center text-sm font-bold">{line.quantity}</span>
                      <button onClick={() => changeQuantity(index, 1)} className="focus-ring rounded-full border border-date/15 p-1"><Plus size={14} /></button>
                      <button onClick={() => setCart((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="focus-ring rounded-full border border-red-200 p-1 text-red-700"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            }) : <p className="rounded-md bg-cream p-4 text-sm text-date/60">Add food to start a staff table order.</p>}
          </div>
          {notice ? <p className="mt-4 rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint"><CheckCircle2 className="mr-1 inline" size={15} /> {notice}</p> : null}
          {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <button
            disabled={!selectedTable || !cart.length || saving}
            onClick={sendToKitchen}
            className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-50"
          >
            <Send size={17} /> {selectedOrder ? "Save Order Changes" : "Send to Kitchen"}
          </button>
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-date/50"><ReceiptText size={14} /> Staff can mark payment after the customer pays at the counter.</p>
        </div>
      </div>
    </section>
  );
}
