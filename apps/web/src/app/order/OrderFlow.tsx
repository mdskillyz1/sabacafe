"use client";

import { useEffect, useMemo, useState } from "react";
import { Bike, Clock, CreditCard, Minus, Plus, QrCode, ReceiptText, ShoppingBag, Store } from "lucide-react";
import { MenuCard } from "@/components/MenuCard";
import {
  businessInfo,
  calculatePrice,
  menuCategories,
  money,
  validatePostcode,
  type CartLine,
  type FulfilmentType,
  type OrderType,
  type PaymentMethod,
  type MenuItem,
  type OperationsSettings
} from "@saba/shared";

export function OrderFlow() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>("PICKUP");
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAY_IN_STORE");
  const [tableNumber, setTableNumber] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [postcode, setPostcode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [menuPublished, setMenuPublished] = useState(false);
  const [settings, setSettings] = useState<OperationsSettings>({
    pickupEnabled: false,
    deliveryEnabled: false,
    dineInEnabled: true,
    stripeEnabled: false,
    payInStoreEnabled: true,
    cashOnCollectionEnabled: false,
    cashOnDeliveryEnabled: false,
    deliveryRadiusMiles: 5,
    deliveryFeePerMilePence: 0,
    originPostcode: businessInfo.deliveryOriginPostcode,
    minimumOrderPence: 1200,
    prepTimeMinutes: 15
  });
  const [deliveryQuote, setDeliveryQuote] = useState<{ allowed: boolean; deliveryFeePence?: number; distanceMiles?: number; reason?: string } | null>(null);
  const dineInOnlyMode =
    settings.dineInEnabled !== false &&
    !settings.pickupEnabled &&
    !settings.deliveryEnabled &&
    settings.stripeEnabled === false;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const table = params.get("table");
    if (type === "dine-in" || type === "dine_in") {
      setOrderType("DINE_IN");
      setFulfilmentType("PICKUP");
      setPaymentMethod("PAY_IN_STORE");
      setPromoCode("");
    }
    if (table) setTableNumber(table);

    fetch("/api/menu", { cache: "no-store" })
      .then((response) => response.json())
      .then((menu) => {
        setItems(menu.items ?? []);
        setMenuPublished(Boolean(menu.published));
      });
    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setSettings(data);
        if (data.dineInEnabled !== false && !data.pickupEnabled && !data.deliveryEnabled) {
          setOrderType("DINE_IN");
          setFulfilmentType("PICKUP");
          setPaymentMethod("PAY_IN_STORE");
          setPromoCode("");
        } else if (type !== "dine-in" && !data.pickupEnabled && data.deliveryEnabled) {
          setOrderType("DELIVERY");
          setFulfilmentType("DELIVERY");
          setPaymentMethod("STRIPE_ONLINE");
        }
      });
  }, []);

  useEffect(() => {
    if (orderType !== "DELIVERY" || fulfilmentType !== "DELIVERY" || !validatePostcode(postcode)) {
      setDeliveryQuote(null);
      return;
    }
    const timeout = window.setTimeout(() => {
      fetch("/api/delivery/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode })
      })
        .then(async (response) => {
          const data = await response.json();
          setDeliveryQuote(response.ok ? data : { ...data, allowed: false });
        })
        .catch(() => setDeliveryQuote({ allowed: false, reason: "Delivery validation is temporarily unavailable." }));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [fulfilmentType, postcode]);

  const deliveryFeePence = orderType === "DELIVERY" && deliveryQuote?.allowed ? deliveryQuote.deliveryFeePence ?? 0 : 0;
  const totals = useMemo(
    () => calculatePrice(cart, items, fulfilmentType, promoCode, 0.2, settings.minimumOrderPence ?? 1200, deliveryFeePence),
    [cart, fulfilmentType, promoCode, items, deliveryFeePence, settings.minimumOrderPence]
  );

  function addItem(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((line) => line.menuItemId === item.id && !line.optionIds.length && !line.addOnIds.length);
      if (existing) {
        return current.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [
        ...current,
        {
          menuItemId: item.id,
          name: item.name,
          unitPricePence: item.pricePence,
          quantity: 1,
          optionIds: [],
          addOnIds: [],
          notes: ""
        }
      ];
    });
  }

  function changeQuantity(menuItemId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) => (line.menuItemId === menuItemId ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  async function submitOrder() {
    setError("");
    const activeOrderType: OrderType = dineInOnlyMode ? "DINE_IN" : orderType;
    const activeFulfilmentType: FulfilmentType = activeOrderType === "DELIVERY" ? "DELIVERY" : "PICKUP";
    const activePaymentMethod: PaymentMethod = dineInOnlyMode ? "PAY_IN_STORE" : paymentMethod;
    if (!cart.length) return setError("Add at least one dish to continue.");
    if (activeOrderType === "DINE_IN" && settings.dineInEnabled === false) return setError("Dine-in QR ordering is currently switched off.");
    if (activeOrderType === "COLLECTION" && !settings.pickupEnabled) return setError("Collection is currently switched off.");
    if (activeOrderType === "DELIVERY" && !settings.deliveryEnabled) return setError("Delivery is currently switched off.");
    if (activeOrderType !== "DINE_IN" && !totals.minimumMet) return setError(`Minimum order is ${money(settings.minimumOrderPence ?? 1200)} before discounts.`);
    if (!customerName) return setError("Please add your name.");
    if (activeOrderType !== "DINE_IN" && !phone) return setError("Please add your phone number.");
    if (activeOrderType === "DINE_IN" && !tableNumber.trim()) return setError("Please confirm your table number.");
    if (activeOrderType === "DELIVERY" && (!addressLine1 || !validatePostcode(postcode))) {
      return setError("Enter a valid delivery address and postcode.");
    }
    if (activeOrderType === "DELIVERY" && (!deliveryQuote || !deliveryQuote.allowed)) {
      return setError(deliveryQuote?.reason ?? "Please enter a delivery postcode inside our delivery radius.");
    }
    setLoading(true);
    const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        email,
        phone,
        fulfilmentType: activeFulfilmentType,
        orderType: activeOrderType,
        paymentMethod: activePaymentMethod,
        tableNumber,
        addressLine1,
        postcode,
        deliveryNotes,
        scheduledFor,
        promoCode: activeOrderType === "DINE_IN" ? "" : promoCode,
        items: cart
      })
    });
    const order = await orderResponse.json();
    if (!orderResponse.ok) {
      setLoading(false);
      return setError(order.error ?? "Order could not be created.");
    }
    if (activePaymentMethod !== "STRIPE_ONLINE") {
      setLoading(false);
      window.location.href = `/order-confirmation?order=${order.id}&payment=${activePaymentMethod.toLowerCase()}`;
      return;
    }
    const checkoutResponse = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id })
    });
    const checkout = await checkoutResponse.json();
    setLoading(false);
    if (!checkoutResponse.ok) return setError(checkout.error ?? "Payment could not be started.");
    if (checkout.url) {
      window.location.href = checkout.url;
      return;
    }
    window.location.href = `/order-confirmation?order=${order.id}&payment=${checkout.mode}`;
  }

  function selectOrderType(nextType: OrderType) {
    setOrderType(nextType);
    setFulfilmentType(nextType === "DELIVERY" ? "DELIVERY" : "PICKUP");
    if (nextType === "DINE_IN") {
      setPaymentMethod("PAY_IN_STORE");
      setPromoCode("");
    }
    if (nextType === "COLLECTION") {
      setPaymentMethod(settings.cashOnCollectionEnabled === false ? "STRIPE_ONLINE" : "CASH_ON_COLLECTION");
      setPromoCode("SABA10");
    }
    if (nextType === "DELIVERY") {
      setPaymentMethod(settings.cashOnDeliveryEnabled ? "CASH_ON_DELIVERY" : "STRIPE_ONLINE");
      setPromoCode("SABA10");
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:px-8">
      <section>
        <div className="rounded-lg bg-date p-6 text-cream">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Soft launch table ordering</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Order from your table, then pay at the counter.</h1>
          <p className="mt-3 text-cream/75">
            Scan the QR code, add your food, send the order to the kitchen, and a staff member will prepare it shortly.
          </p>
        </div>
        {!menuPublished || !items.length ? (
          <div className="mt-8 rounded-lg border border-date/10 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Ordering not available</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-date">The online menu has not been published yet.</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-date/70">
              Please call {businessInfo.phone} or visit {businessInfo.formattedAddress}. Once Saba Cafe publishes its menu
              from admin, online ordering will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {menuCategories.map((category) => {
            const categoryItems = items.filter((item) => item.categoryId === category.id);
            if (!categoryItems.length) return null;
            return (
              <section key={category.id}>
                <h2 className="font-display text-3xl font-semibold text-date">{category.name}</h2>
                <div className="mt-4 grid gap-5">
                  {categoryItems.map((item) => (
                    <MenuCard key={item.id} item={item} onAdd={addItem} />
                  ))}
                </div>
              </section>
            );
          })}
          </div>
        )}
      </section>

      <aside className="rounded-lg border border-date/10 bg-white shadow-soft lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
        <div className="sticky top-0 z-10 border-b border-date/10 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Table order</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-date">Your basket</h2>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-clay">
              <ShoppingBag size={20} />
            </span>
          </div>
        </div>

        <div className="p-5">
          {dineInOnlyMode ? (
            <div className="rounded-lg border border-mint/20 bg-mint/10 p-4 text-sm leading-6 text-date">
              <div className="flex items-center gap-2 font-semibold text-mint">
                <QrCode size={18} /> Dine-in QR ordering only
              </div>
              <p className="mt-2 text-date/70">Send your order to the kitchen from the table, then pay at the counter.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => selectOrderType("DINE_IN")}
                  disabled={settings.dineInEnabled === false}
                  className={`focus-ring rounded-md border px-3 py-3 text-sm font-semibold ${orderType === "DINE_IN" ? "border-date bg-date text-cream" : "border-date/15"}`}
                >
                  <QrCode className="mx-auto mb-1" size={18} /> Dine-in
                </button>
                {settings.pickupEnabled ? (
                  <button
                    type="button"
                    onClick={() => selectOrderType("COLLECTION")}
                    className={`focus-ring rounded-md border px-3 py-3 text-sm font-semibold ${orderType === "COLLECTION" ? "border-date bg-date text-cream" : "border-date/15"}`}
                  >
                    <Store className="mx-auto mb-1" size={18} /> Collection
                  </button>
                ) : null}
                {settings.deliveryEnabled ? (
                  <button
                    type="button"
                    onClick={() => selectOrderType("DELIVERY")}
                    className={`focus-ring rounded-md border px-3 py-3 text-sm font-semibold ${orderType === "DELIVERY" ? "border-date bg-date text-cream" : "border-date/15"}`}
                  >
                    <Bike className="mx-auto mb-1" size={18} /> Delivery
                  </button>
                ) : null}
              </div>
              {settings.deliveryEnabled ? (
                <p className="mt-3 rounded-md bg-cream p-3 text-xs leading-5 text-date/65">
                  Delivery is available within {settings.deliveryRadiusMiles} miles of {businessInfo.formattedAddress}.
                  {settings.deliveryFeePerMilePence > 0 ? ` Fee: ${money(settings.deliveryFeePerMilePence)} per mile.` : " Delivery fee is set by staff."}
                </p>
              ) : null}
            </>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-date/55">
            <span className="rounded-md bg-cream px-2 py-2">Add food</span>
            <span className="rounded-md bg-cream px-2 py-2">Send order</span>
            <span className="rounded-md bg-cream px-2 py-2">Pay counter</span>
          </div>

          <div className="mt-5 space-y-3">
            {cart.length ? (
              cart.map((line) => (
                <div key={line.menuItemId} className="rounded-lg border border-date/10 bg-cream/80 p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-date">{line.name}</p>
                      <p className="text-sm text-date/60">{money(line.unitPricePence)} each</p>
                    </div>
                    <div className="flex h-9 items-center gap-2 rounded-full bg-white px-2">
                      <button className="focus-ring rounded-full border border-date/15 p-1" onClick={() => changeQuantity(line.menuItemId, -1)} type="button">
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                      <button className="focus-ring rounded-full border border-date/15 p-1" onClick={() => changeQuantity(line.menuItemId, 1)} type="button">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <input
                    aria-label={`Notes for ${line.name}`}
                    placeholder="Notes for kitchen"
                    className="focus-ring mt-3 w-full rounded-md border border-date/10 bg-white px-3 py-2 text-sm"
                    onChange={(event) =>
                      setCart((current) => current.map((candidate) => (candidate.menuItemId === line.menuItemId ? { ...candidate, notes: event.target.value } : candidate)))
                    }
                  />
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-date/15 bg-cream p-5 text-center">
                <ReceiptText className="mx-auto text-clay" size={24} />
                <p className="mt-3 text-sm font-semibold text-date">Your basket is empty</p>
                <p className="mt-1 text-sm text-date/60">Add dishes from the menu to send your table order to the kitchen.</p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder="Name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            {!dineInOnlyMode ? <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder="Email (optional)" value={email} onChange={(event) => setEmail(event.target.value)} /> : null}
            <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder={orderType === "DINE_IN" ? "Phone (optional)" : "Phone"} value={phone} onChange={(event) => setPhone(event.target.value)} />
            {orderType === "DINE_IN" ? (
              <label className="text-sm font-semibold text-date/70">
                Table number
                <input className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal" placeholder="e.g. 12" value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} />
              </label>
            ) : null}
            {orderType === "DELIVERY" ? (
              <>
                <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder="Delivery address" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} />
                <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder="Postcode" value={postcode} onChange={(event) => setPostcode(event.target.value)} />
                {postcode ? (
                  <p className={`rounded-md p-3 text-sm ${deliveryQuote?.allowed ? "bg-mint/10 text-mint" : "bg-red-50 text-red-700"}`}>
                    {deliveryQuote?.allowed
                      ? `Delivery approved: ${deliveryQuote.distanceMiles} miles away. Fee ${money(deliveryQuote.deliveryFeePence ?? 0)}.`
                      : deliveryQuote?.reason ?? `Delivery must be within ${settings.deliveryRadiusMiles} miles.`}
                  </p>
                ) : null}
                <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder="Delivery notes" value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} />
              </>
            ) : null}
            {orderType !== "DINE_IN" ? <label className="text-sm font-semibold text-date/70">
              <Clock className="mr-1 inline" size={15} /> ASAP or scheduled time
              <input className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
            </label> : null}
            {orderType !== "DINE_IN" ? <input className="focus-ring rounded-md border border-date/15 px-4 py-3" placeholder="Promo code" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} /> : null}
            {dineInOnlyMode ? (
              <p className="rounded-md bg-saffron/15 p-3 text-sm font-semibold text-date">Payment: please pay at the counter after ordering.</p>
            ) : (
              <label className="text-sm font-semibold text-date/70">
                Payment method
                <select className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                  {settings.stripeEnabled !== false ? <option value="STRIPE_ONLINE">Pay online by card</option> : null}
                  {orderType === "DINE_IN" && settings.payInStoreEnabled !== false ? <option value="PAY_IN_STORE">Pay in store</option> : null}
                  {orderType === "COLLECTION" && settings.cashOnCollectionEnabled !== false ? <option value="CASH_ON_COLLECTION">Cash / pay on collection</option> : null}
                  {orderType === "DELIVERY" && settings.cashOnDeliveryEnabled ? <option value="CASH_ON_DELIVERY">Cash on delivery</option> : null}
                </select>
              </label>
            )}
          </div>

          <div className="mt-5 space-y-2 rounded-lg border border-date/10 bg-white p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotalPence)}</span></div>
            {totals.discountPence ? <div className="flex justify-between"><span>Discount</span><span>-{money(totals.discountPence)}</span></div> : null}
            {totals.deliveryFeePence ? <div className="flex justify-between"><span>Delivery</span><span>{money(totals.deliveryFeePence)}</span></div> : null}
            <div className="flex justify-between"><span>VAT included</span><span>{money(totals.vatPence)}</span></div>
            <div className="flex justify-between border-t border-date/10 pt-2 text-lg font-semibold text-date"><span>Total</span><span>{money(totals.totalPence)}</span></div>
          </div>
          {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <button
            type="button"
            onClick={submitOrder}
            disabled={loading}
            className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-mint px-5 py-4 font-semibold text-white disabled:opacity-60"
          >
            {paymentMethod === "STRIPE_ONLINE" && !dineInOnlyMode ? <CreditCard size={18} /> : <QrCode size={18} />}
            {loading ? "Sending order..." : paymentMethod === "STRIPE_ONLINE" && !dineInOnlyMode ? "Pay securely" : "Send table order"}
          </button>
        </div>
      </aside>
    </main>
  );
}
