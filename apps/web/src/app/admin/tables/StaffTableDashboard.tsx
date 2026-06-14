"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChefHat, Clock3, CreditCard, Minus, Plus, ReceiptText, RefreshCw, Search, Send, Table2, Trash2, UserRound } from "lucide-react";
import { MenuCard } from "@/components/MenuCard";
import { calculatePrice, money, type CartLine, type MenuItem } from "@saba/shared";

type TableRecord = { id: string; name: string; capacity: number; active: boolean };
type MenuCategoryRecord = { id: string; name: string; slug?: string };
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

function orderStatus(order?: OrderRecord) {
  return order?.status ?? order?.orderStatus ?? "";
}

function statusLabel(order?: OrderRecord, draftCount = 0) {
  if (draftCount) return "Ordering";
  if (!order) return "Available";
  const status = orderStatus(order);
  if (order.paymentStatus === "PAID" && status === "COMPLETED") return "Paid";
  if (status === "READY") return "Ready";
  if (["RECEIVED", "ACCEPTED", "PREPARING"].includes(status)) return "Sent to Kitchen";
  return status.replaceAll("_", " ");
}

function orderItems(order?: OrderRecord) {
  return order?.items ?? order?.checkout.items ?? [];
}

function orderItemCount(order?: OrderRecord) {
  return orderItems(order).reduce((sum, item) => sum + item.quantity, 0);
}

function tableTone(label: string) {
  if (label === "Available") return "border-mint/25 bg-mint/10 text-mint";
  if (label === "Ordering") return "border-saffron/40 bg-saffron/15 text-clay";
  if (label === "Ready") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (label === "Paid") return "border-date/15 bg-cream text-date";
  return "border-clay/25 bg-clay/10 text-clay";
}

function optionDelta(item: MenuItem | undefined, line: CartLine) {
  return line.optionIds.reduce((sum, optionId) => sum + (item?.options.find((option) => option.id === optionId)?.priceDeltaPence ?? 0), 0);
}

export function StaffTableDashboard() {
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategoryRecord[]>([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [customerName, setCustomerName] = useState("");
  const [currentRole, setCurrentRole] = useState<AdminRole>("STAFF");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const activeOrders = orders.filter((order) => !["COMPLETED", "CANCELLED"].includes(orderStatus(order)));
  const selectedOrder = selectedTable ? activeOrders.find((order) => order.tableId === selectedTable.id || order.tableNumber === selectedTable.name) : undefined;
  const selectedExistingItems = orderItems(selectedOrder);
  const readyOrders = activeOrders.filter((order) => orderStatus(order) === "READY");
  const unpaidOrders = activeOrders.filter((order) => order.paymentStatus !== "PAID");
  const floorTotal = activeOrders.reduce((sum, order) => sum + (order.totalPence ?? order.totals.totalPence), 0);
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items
      .filter((item) => item.available && item.published && !item.hidden)
      .filter((item) => categoryId === "all" || item.categoryId === categoryId)
      .filter((item) => !term || item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term))
      .slice(0, 18);
  }, [categoryId, items, search]);
  const totals = calculatePrice(cart, items, "PICKUP", "", 0.2, 0, 0);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const [tableResponse, orderResponse, menuResponse] = await Promise.all([
      fetch("/api/admin/tables", { cache: "no-store" }),
      fetch("/api/admin/orders?orderType=DINE_IN", { cache: "no-store" }),
      fetch("/api/menu", { cache: "no-store" })
    ]);
    const [tableBody, orderBody, menuBody] = await Promise.all([tableResponse.json(), orderResponse.json(), menuResponse.json()]);
    setTables((tableBody.tables ?? []).filter((table: TableRecord) => table.active));
    setOrders(orderBody.orders ?? []);
    setItems(menuBody.items ?? []);
    setCategories(menuBody.categories ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setCurrentRole(body.user?.role ?? "STAFF"))
      .catch(() => setCurrentRole("STAFF"));
    const timer = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(timer);
  }, []);

  function addItem(item: MenuItem, optionIds: string[] = [], optionLabels: string[] = [], notes = "") {
    if (!selectedTable) {
      setError("Choose a table before adding food.");
      return;
    }
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
    setCart([...orderItems(order)]);
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
    <section className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Live table orders", value: activeOrders.length, helper: `${readyOrders.length} ready`, icon: ChefHat },
          { label: "Available tables", value: Math.max(0, tables.length - activeOrders.length), helper: `${tables.length} active tables`, icon: Table2 },
          { label: "Need payment", value: unpaidOrders.length, helper: "Pay at counter", icon: CreditCard },
          { label: "Floor total", value: money(floorTotal), helper: "Active dine-in value", icon: ReceiptText }
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-date/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-date/60">{card.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-clay"><card.icon size={17} /></span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-date">{card.value}</p>
            <p className="mt-1 text-xs font-semibold text-date/45">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_25rem]">
        <div className="space-y-6">
          <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-semibold text-date">Restaurant floor</h2>
                <p className="mt-1 text-sm text-date/60">Tap a table to open its live order, amend food, or take counter payment.</p>
              </div>
              <button onClick={() => load(true)} className="focus-ring inline-flex items-center gap-2 rounded-full border border-date/15 px-4 py-2 text-sm font-semibold text-date">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tables.map((table) => {
                const order = activeOrders.find((row) => row.tableId === table.id || row.tableNumber === table.name);
                const isSelected = selectedTableId === table.id;
                const label = statusLabel(order, isSelected ? cart.length : 0);
                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTableId(table.id);
                      setError("");
                      setNotice("");
                    }}
                    className={`focus-ring rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${isSelected ? "border-mint bg-mint/10 shadow-sm" : "border-date/10 bg-cream/70 hover:border-mint/40"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex items-center gap-2 font-display text-2xl font-semibold text-date"><Table2 size={18} /> {table.name}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${tableTone(label)}`}>{label}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <span className="rounded-md bg-white/80 p-2 text-date/60"><UserRound className="mr-1 inline" size={14} /> {table.capacity} seats</span>
                      <span className="rounded-md bg-white/80 p-2 font-semibold text-date">{order ? money(order.totalPence ?? order.totals.totalPence) : "No order"}</span>
                    </div>
                    {order ? (
                      <p className="mt-3 text-xs font-semibold text-date/55">
                        {order.orderNumber} • {orderItemCount(order)} item{orderItemCount(order) === 1 ? "" : "s"} • {order.paymentStatus === "PAID" ? "Paid" : "Pay at counter"}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs font-semibold text-mint">Open table to start an order</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-semibold text-date">Live table orders</h2>
                <p className="mt-1 text-sm text-date/60">Open, amend, mark paid, or clear active orders from one place.</p>
              </div>
              <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold text-date">{activeOrders.length} live</span>
            </div>
            <div className="mt-5 grid gap-3">
              {activeOrders.length ? activeOrders.map((order) => (
                <div key={order.id} className="rounded-lg border border-date/10 bg-cream/60 p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-xl font-semibold text-date">{order.tableNumber ?? "Table"}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-date">{order.orderNumber}</span>
                        <span className="rounded-full bg-saffron/20 px-2.5 py-1 text-xs font-bold text-clay">{statusLabel(order)}</span>
                        <span className="rounded-full bg-mint/10 px-2.5 py-1 text-xs font-bold text-mint">{order.paymentStatus === "PAID" ? "Paid" : "Pay at counter"}</span>
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-date/70">
                        {orderItems(order).slice(0, 4).map((line, index) => (
                          <p key={`${order.id}-${line.menuItemId}-${index}`}><span className="font-semibold text-date">{line.quantity}x</span> {line.name}{line.optionLabels?.length ? ` • ${line.optionLabels.join(" • ")}` : ""}</p>
                        ))}
                        {orderItems(order).length > 4 ? <p className="font-semibold text-date/45">+ {orderItems(order).length - 4} more line{orderItems(order).length - 4 === 1 ? "" : "s"}</p> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <p className="mr-2 font-display text-2xl font-semibold text-date">{money(order.totalPence ?? order.totals.totalPence)}</p>
                      <button onClick={() => startAmendOrder(order)} className="focus-ring rounded-full border border-date/15 bg-white px-4 py-2 text-sm font-semibold text-date">Open / Amend</button>
                      <button onClick={() => patchOrder(order, "payment-status", { paymentStatus: "PAID" }, "Payment marked paid.")} className="focus-ring rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-date">Mark Paid</button>
                      <button onClick={() => clearTable(order)} className="focus-ring rounded-full bg-date px-4 py-2 text-sm font-semibold text-cream">Clear</button>
                    </div>
                  </div>
                </div>
              )) : <p className="rounded-md bg-cream p-4 text-sm text-date/60">No live table orders yet.</p>}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-3xl font-semibold text-date">{selectedTable ? `${selectedTable.name} workbench` : "Select a table"}</h2>
            {selectedTable ? (
              <p className="mt-1 text-sm text-date/60">Search the menu, add food, and send this table to kitchen.</p>
            ) : (
              <p className="mt-3 rounded-md bg-cream p-4 text-sm text-date/60">Choose a table from the floor to start or amend an order.</p>
            )}
            {selectedOrder ? (
              <div className="mt-4 rounded-lg border border-saffron/25 bg-saffron/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-date">{selectedOrder.orderNumber} • {statusLabel(selectedOrder)}</p>
                    <p className="mt-1 text-sm text-date/65">Total {money(selectedOrder.totalPence ?? selectedOrder.totals.totalPence)} • {selectedOrder.paymentStatus}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-clay">{orderItemCount(selectedOrder)} items</span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-date/70">
                  {selectedExistingItems.map((line, index) => (
                    <p key={`${line.menuItemId}-${index}`}><span className="font-semibold text-date">{line.quantity}x</span> {line.name}{line.notes ? ` • ${line.notes}` : ""}</p>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => startAmendOrder(selectedOrder)} className="focus-ring rounded-full border border-date/15 bg-white px-4 py-2 text-sm font-semibold text-date">Amend</button>
                  {currentRole !== "STAFF" ? (
                    <>
                      <button onClick={() => patchOrder(selectedOrder, "status", { status: "PREPARING" }, "Order marked preparing.")} className="focus-ring rounded-full bg-date px-4 py-2 text-sm font-semibold text-cream">Preparing</button>
                      <button onClick={() => patchOrder(selectedOrder, "status", { status: "READY" }, "Order marked ready.")} className="focus-ring rounded-full bg-mint px-4 py-2 text-sm font-semibold text-white">Ready</button>
                    </>
                  ) : null}
                  <button onClick={() => patchOrder(selectedOrder, "payment-status", { paymentStatus: "PAID" }, "Payment marked paid.")} className="focus-ring rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-date">Mark Paid</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-date/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl font-semibold text-date">Menu</h2>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-date">{selectedTable ? selectedTable.name : "No table"}</span>
            </div>
            <div className="mt-4 space-y-3">
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer name optional" className="focus-ring w-full rounded-md border border-date/15 px-4 py-3" />
              <label className="flex items-center gap-2 rounded-md border border-date/15 px-4 py-3">
                <Search size={17} className="text-date/45" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu item" className="w-full border-0 bg-transparent outline-none" />
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setCategoryId("all")} className={`focus-ring shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${categoryId === "all" ? "bg-date text-cream" : "bg-cream text-date"}`}>All</button>
                {categories.map((category) => (
                  <button key={category.id} onClick={() => setCategoryId(category.id)} className={`focus-ring shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${categoryId === category.id ? "bg-date text-cream" : "bg-cream text-date"}`}>{category.name}</button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid max-h-[42rem] gap-4 overflow-y-auto pr-1">
              {selectedTable ? filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} onAdd={addItem} compact quantity={cart.filter((line) => line.menuItemId === item.id).length} />
              )) : <p className="rounded-md bg-cream p-4 text-sm text-date/60">Pick a table first. The menu will open here for that table.</p>}
            </div>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-3 z-20 rounded-xl border border-date/10 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-semibold text-date">Current order</h2>
              <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold text-date">{selectedTable?.name ?? "No table"}</span>
              <span className="rounded-full bg-mint/10 px-3 py-1 text-sm font-semibold text-mint">{money(totals.totalPence)}</span>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {cart.length ? cart.map((line, index) => {
                const item = items.find((candidate) => candidate.id === line.menuItemId);
                return (
                  <div key={`${line.menuItemId}-${index}`} className="min-w-64 rounded-md border border-date/10 bg-cream/70 p-3">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-date">{line.name}</p>
                        <p className="text-sm text-date/60">{money(line.unitPricePence + optionDelta(item, line))} each</p>
                        {line.optionLabels?.length ? <p className="mt-1 text-xs font-semibold text-clay">{line.optionLabels.join(" • ")}</p> : null}
                        {line.notes ? <p className="mt-1 text-xs text-date/55">Note: {line.notes}</p> : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
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
            {notice ? <p className="mt-3 rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint"><CheckCircle2 className="mr-1 inline" size={15} /> {notice}</p> : null}
            {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          </div>
          <div className="flex flex-col gap-2 lg:min-w-60">
            <button
              disabled={!selectedTable || !cart.length || saving}
              onClick={sendToKitchen}
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-50"
            >
              <Send size={17} /> {selectedOrder ? "Save Changes" : "Send to Kitchen"}
            </button>
            <p className="flex items-center justify-center gap-2 text-xs font-semibold text-date/50"><Clock3 size={14} /> Staff marks paid after counter payment.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
