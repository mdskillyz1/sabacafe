"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bike, CheckCircle2, Clock, CreditCard, Minus, Plus, QrCode, ReceiptText, ShoppingBag, Store } from "lucide-react";
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
  const basketRef = useRef<HTMLElement | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>("PICKUP");
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAY_IN_STORE");
  const [tableNumber, setTableNumber] = useState("");
  const [hasTableQrAccess, setHasTableQrAccess] = useState(false);
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
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuPublished, setMenuPublished] = useState(false);
  const [lastAdded, setLastAdded] = useState("");
  const [cartPulse, setCartPulse] = useState(false);
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
    const isDineInQrLink = (type === "dine-in" || type === "dine_in") && Boolean(table?.trim());
    if (type === "dine-in" || type === "dine_in") {
      setOrderType("DINE_IN");
      setFulfilmentType("PICKUP");
      setPaymentMethod("PAY_IN_STORE");
      setPromoCode("");
    }
    setHasTableQrAccess(isDineInQrLink);
    if (table) setTableNumber(table);

    fetch("/api/menu", { cache: "no-store" })
      .then((response) => response.json())
      .then((menu) => {
        setItems(menu.items ?? []);
        setMenuPublished(Boolean(menu.published));
      })
      .finally(() => setMenuLoading(false));
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
  const cartItemCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const cartQuantities = useMemo(
    () => new Map(cart.map((line) => [line.menuItemId, line.quantity])),
    [cart]
  );
  const visibleCategories = useMemo(
    () => menuCategories.filter((category) => items.some((item) => item.categoryId === category.id)),
    [items]
  );

  useEffect(() => {
    if (!lastAdded) return;
    const timeout = window.setTimeout(() => setLastAdded(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [lastAdded]);

  useEffect(() => {
    if (!cartPulse) return;
    const timeout = window.setTimeout(() => setCartPulse(false), 650);
    return () => window.clearTimeout(timeout);
  }, [cartPulse]);

  function addItem(item: MenuItem, optionIds: string[] = [], optionLabels: string[] = [], notes = "") {
    setLastAdded(item.name);
    setCartPulse(true);
    setCart((current) => {
      const optionKey = optionIds.slice().sort().join("|");
      const cleanNotes = notes.trim();
      const existing = current.find((line) => line.menuItemId === item.id && line.optionIds.slice().sort().join("|") === optionKey && (line.notes ?? "") === cleanNotes && !line.addOnIds.length);
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
          optionIds,
          optionLabels,
          addOnIds: [],
          notes: cleanNotes
        }
      ];
    });
  }

  function lineUnitPrice(line: CartLine) {
    const item = items.find((candidate) => candidate.id === line.menuItemId);
    const optionDelta = line.optionIds.reduce((sum, optionId) => {
      return sum + (item?.options.find((option) => option.id === optionId)?.priceDeltaPence ?? 0);
    }, 0);
    return line.unitPricePence + optionDelta;
  }

  function scrollToBasket() {
    basketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function changeQuantity(lineIndex: number, delta: number) {
    setCart((current) =>
      current
        .map((line, index) => (index === lineIndex ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line))
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
    if (activeOrderType === "DINE_IN" && !hasTableQrAccess) return setError("Please scan the QR code on your table to send an order to the kitchen.");
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
    <main className="mx-auto grid w-full max-w-7xl gap-6 overflow-x-hidden px-3 pb-28 pt-5 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:px-8 lg:pb-8">
      {lastAdded ? (
        <div className="fixed left-4 right-4 top-24 z-[65] mx-auto flex max-w-md items-center gap-3 rounded-full border border-mint/20 bg-white px-4 py-3 text-sm font-semibold text-date shadow-soft md:top-20" role="status" aria-live="polite">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-white">
            <CheckCircle2 size={18} />
          </span>
          <span className="min-w-0 flex-1 truncate">{lastAdded} added to basket</span>
          <button type="button" onClick={scrollToBasket} className="rounded-full bg-cream px-3 py-2 text-xs text-date">
            View
          </button>
        </div>
      ) : null}
      <section>
        <div className="max-w-full overflow-hidden rounded-lg bg-date p-5 text-cream sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Soft launch table ordering</p>
          <h1 className="mt-2 max-w-full break-words font-display text-2xl font-semibold leading-tight min-[390px]:text-3xl sm:text-4xl">Order from your table, then pay at the counter.</h1>
          <p className="mt-3 max-w-full text-base leading-7 text-cream/75">
            Scan the QR code, add your food, send the order to the kitchen, and a staff member will prepare it shortly.
          </p>
        </div>
        {menuLoading ? (
          <div className="mt-8 rounded-lg border border-date/10 bg-white p-8 shadow-sm" aria-live="polite">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">Loading menu</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-date">Getting the table menu ready.</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-date/70">
              Saba Cafe&apos;s live menu is loading. You&apos;ll be able to add dishes in just a moment.
            </p>
            <div className="mt-8 space-y-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="grid overflow-hidden rounded-lg border border-date/10 bg-white shadow-sm sm:grid-cols-[180px_1fr]">
                  <div className="min-h-48 animate-pulse bg-cream" />
                  <div className="space-y-4 p-5">
                    <div className="h-7 w-2/3 animate-pulse rounded-full bg-cream" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-cream" />
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-cream" />
                    <div className="h-10 w-36 animate-pulse rounded-full bg-cream" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !menuPublished || !items.length ? (
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
            <nav aria-label="Order categories" className="sticky top-[106px] z-40 rounded-lg border border-date/10 bg-cream/95 p-3 shadow-sm backdrop-blur sm:top-[73px] sm:bg-white/95">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-clay sm:hidden">Choose category</p>
              <div className="flex flex-wrap gap-2">
                {visibleCategories.map((category) => (
                  <a
                    key={category.id}
                    href={`#order-${category.slug}`}
                    className="focus-ring inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-date/10 bg-white px-3 py-2 text-center text-xs font-semibold leading-tight text-date shadow-sm transition hover:border-mint hover:text-mint sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            </nav>

            {visibleCategories.map((category) => {
              const categoryItems = items.filter((item) => item.categoryId === category.id);
              return (
                <section key={category.id} id={`order-${category.slug}`} className="scroll-mt-40 sm:scroll-mt-32">
                  <h2 className="font-display text-3xl font-semibold text-date">{category.name}</h2>
                  <div className="mt-4 grid gap-5">
                    {categoryItems.map((item) => (
                      <MenuCard key={item.id} item={item} onAdd={addItem} quantity={cartQuantities.get(item.id) ?? 0} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <aside ref={basketRef} id="basket" className={`scroll-mt-24 rounded-lg border border-date/10 bg-white shadow-soft transition lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain ${cartPulse ? "ring-4 ring-mint/20" : ""}`}>
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
            <div className={`rounded-lg border p-4 text-sm leading-6 text-date ${hasTableQrAccess ? "border-mint/20 bg-mint/10" : "border-saffron/30 bg-saffron/15"}`}>
              <div className={`flex items-center gap-2 font-semibold ${hasTableQrAccess ? "text-mint" : "text-clay"}`}>
                <QrCode size={18} /> {hasTableQrAccess ? "Table QR connected" : "Menu browsing only"}
              </div>
              <p className="mt-2 text-date/70">
                {hasTableQrAccess
                  ? "Send your order to the kitchen from the table, then pay at the counter."
                  : "You can view the menu here. To place an order, please scan the QR code on your table inside Saba Cafe."}
              </p>
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
              cart.map((line, lineIndex) => (
                <div key={`${line.menuItemId}-${line.optionIds.join("-")}-${lineIndex}`} className="rounded-lg border border-date/10 bg-cream/80 p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-date">{line.name}</p>
                      <p className="text-sm text-date/60">{money(lineUnitPrice(line))} each</p>
                      {line.optionLabels?.length ? (
                        <ul className="mt-2 space-y-1 text-xs font-semibold text-clay">
                          {line.optionLabels.map((label) => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="flex h-9 items-center gap-2 rounded-full bg-white px-2">
                      <button className="focus-ring rounded-full border border-date/15 p-1" onClick={() => changeQuantity(lineIndex, -1)} type="button">
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                      <button className="focus-ring rounded-full border border-date/15 p-1" onClick={() => changeQuantity(lineIndex, 1)} type="button">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <input
                    aria-label={`Notes for ${line.name}`}
                    placeholder="Notes for kitchen"
                    className="focus-ring mt-3 w-full rounded-md border border-date/10 bg-white px-3 py-2 text-sm"
                    onChange={(event) =>
                      setCart((current) => current.map((candidate, index) => (index === lineIndex ? { ...candidate, notes: event.target.value } : candidate)))
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
                <input
                  className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal"
                  placeholder="Scan table QR code"
                  value={tableNumber}
                  onChange={(event) => setTableNumber(event.target.value)}
                  readOnly={!hasTableQrAccess}
                />
                {!hasTableQrAccess ? <span className="mt-2 block text-xs font-normal text-clay">Ordering unlocks from the table QR code only.</span> : null}
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
            disabled={loading || (dineInOnlyMode && !hasTableQrAccess)}
            className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-mint px-5 py-4 font-semibold text-white disabled:opacity-60"
          >
            {paymentMethod === "STRIPE_ONLINE" && !dineInOnlyMode ? <CreditCard size={18} /> : <QrCode size={18} />}
            {loading
              ? "Sending order..."
              : dineInOnlyMode && !hasTableQrAccess
                ? "Scan table QR to order"
                : paymentMethod === "STRIPE_ONLINE" && !dineInOnlyMode
                  ? "Pay securely"
                  : "Send table order"}
          </button>
        </div>
      </aside>
      {cartItemCount > 0 ? (
        <div className="fixed inset-x-3 bottom-3 z-[60] rounded-full border border-date/10 bg-date p-2 text-cream shadow-soft md:hidden">
          <button type="button" onClick={scrollToBasket} className="focus-ring flex min-h-12 w-full items-center justify-between gap-3 rounded-full px-3 text-left">
            <span className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-mint font-bold text-white transition ${cartPulse ? "scale-110" : ""}`}>
                {cartItemCount}
              </span>
              <span>
                <span className="block text-sm font-semibold">Your basket</span>
                <span className="block text-xs text-cream/70">Tap to review and send</span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-cream px-4 py-2 text-sm font-semibold text-date">{money(totals.totalPence)}</span>
          </button>
        </div>
      ) : null}
    </main>
  );
}
