"use client";

import { useEffect, useMemo, useState } from "react";
import { Bike, CheckCircle2, CreditCard, MapPin, QrCode, Save, Store, Truck, type LucideIcon } from "lucide-react";
import { businessInfo, money, type OperationsSettings } from "@saba/shared";

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? "bg-mint/10 text-mint" : "bg-red-50 text-red-700"}`}>
      {enabled ? "On" : "Off"}
    </span>
  );
}

function ToggleCard({
  icon: Icon,
  title,
  description,
  enabled,
  onChange
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`focus-ring flex min-h-36 w-full items-start justify-between gap-4 rounded-lg border p-5 text-left shadow-sm transition ${
        enabled ? "border-mint/30 bg-mint/5" : "border-date/10 bg-white"
      }`}
    >
      <span className="flex gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${enabled ? "bg-mint text-white" : "bg-date/10 text-date"}`}>
          <Icon size={21} />
        </span>
        <span>
          <span className="block font-display text-2xl font-semibold text-date">{title}</span>
          <span className="mt-2 block text-sm leading-6 text-date/65">{description}</span>
        </span>
      </span>
      <StatusPill enabled={enabled} />
    </button>
  );
}

export function AdminOperationsSettings() {
  const [settings, setSettings] = useState<OperationsSettings>({
    pickupEnabled: true,
    deliveryEnabled: true,
    dineInEnabled: true,
    stripeEnabled: true,
    payInStoreEnabled: true,
    cashOnCollectionEnabled: true,
    cashOnDeliveryEnabled: false,
    deliveryRadiusMiles: 5,
    deliveryFeePerMilePence: 0,
    originPostcode: businessInfo.deliveryOriginPostcode,
    minimumOrderPence: 1200,
    prepTimeMinutes: 15
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setSettings(data));
  }, []);

  const deliveryPreview = useMemo(() => {
    const radius = Number(settings.deliveryRadiusMiles) || 0;
    const fee = Number(settings.deliveryFeePerMilePence) || 0;
    const maxFee = Math.ceil(radius) * fee;
    return {
      radius,
      fee,
      maxFee
    };
  }, [settings.deliveryRadiusMiles, settings.deliveryFeePerMilePence]);

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    const saved = await response.json();
    setSettings(saved);
    setSaving(false);
    setMessage("Saved. Customer checkout now uses these dine-in, collection, delivery, and payment rules.");
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ToggleCard
          icon={QrCode}
          title="Dine-in QR"
          description="Allow customers at tables to scan a QR code and order to their table."
          enabled={settings.dineInEnabled !== false}
          onChange={(enabled) => setSettings((current) => ({ ...current, dineInEnabled: enabled }))}
        />
        <ToggleCard
          icon={Store}
          title="Collection"
          description="Allow customers to choose collection from Saba Cafe."
          enabled={settings.pickupEnabled}
          onChange={(enabled) => setSettings((current) => ({ ...current, pickupEnabled: enabled }))}
        />
        <ToggleCard
          icon={Bike}
          title="Delivery"
          description="Allow customers inside the delivery radius to request delivery."
          enabled={settings.deliveryEnabled}
          onChange={(enabled) => setSettings((current) => ({ ...current, deliveryEnabled: enabled }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ToggleCard
          icon={CreditCard}
          title="Stripe online"
          description="Allow customers to pay online by card through Stripe."
          enabled={settings.stripeEnabled !== false}
          onChange={(enabled) => setSettings((current) => ({ ...current, stripeEnabled: enabled }))}
        />
        <ToggleCard
          icon={Store}
          title="Pay in store"
          description="Allow dine-in customers to send the order and pay at the counter."
          enabled={settings.payInStoreEnabled !== false}
          onChange={(enabled) => setSettings((current) => ({ ...current, payInStoreEnabled: enabled }))}
        />
        <ToggleCard
          icon={Store}
          title="Cash collection"
          description="Allow collection customers to pay when collecting."
          enabled={settings.cashOnCollectionEnabled !== false}
          onChange={(enabled) => setSettings((current) => ({ ...current, cashOnCollectionEnabled: enabled }))}
        />
        <ToggleCard
          icon={Bike}
          title="Cash delivery"
          description="Allow delivery customers to pay cash on delivery."
          enabled={settings.cashOnDeliveryEnabled === true}
          onChange={(enabled) => setSettings((current) => ({ ...current, cashOnDeliveryEnabled: enabled }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-date/10 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-saffron/15 text-clay">
              <MapPin size={21} />
            </span>
            <div>
              <h2 className="font-display text-3xl font-semibold text-date">Delivery area</h2>
              <p className="mt-2 text-sm leading-6 text-date/65">
                Orders are measured from the restaurant postcode. Customers outside the radius cannot continue to payment.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-date/70">
              Restaurant postcode
              <input
                value={settings.originPostcode}
                onChange={(event) => setSettings((current) => ({ ...current, originPostcode: event.target.value }))}
                className="focus-ring mt-1 w-full rounded-md border border-date/15 px-4 py-3 font-normal"
              />
            </label>
            <label className="text-sm font-semibold text-date/70">
              Radius
              <div className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={settings.deliveryRadiusMiles}
                  onChange={(event) => setSettings((current) => ({ ...current, deliveryRadiusMiles: Number(event.target.value) }))}
                  className="focus-ring w-full border-0 px-4 py-3 font-normal"
                />
                <span className="flex items-center border-l border-date/10 px-4 text-sm text-date/55">miles</span>
              </div>
            </label>
            <label className="text-sm font-semibold text-date/70">
              Minimum order
              <div className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white">
                <span className="flex items-center border-r border-date/10 px-4 text-sm text-date/55">£</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={((settings.minimumOrderPence ?? 1200) / 100).toString()}
                  onChange={(event) => setSettings((current) => ({ ...current, minimumOrderPence: Math.round(Number(event.target.value) * 100) }))}
                  className="focus-ring w-full border-0 px-4 py-3 font-normal"
                />
              </div>
            </label>
            <label className="text-sm font-semibold text-date/70">
              Prep estimate
              <div className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white">
                <input
                  type="number"
                  min={0}
                  value={settings.prepTimeMinutes ?? 15}
                  onChange={(event) => setSettings((current) => ({ ...current, prepTimeMinutes: Number(event.target.value) }))}
                  className="focus-ring w-full border-0 px-4 py-3 font-normal"
                />
                <span className="flex items-center border-l border-date/10 px-4 text-sm text-date/55">mins</span>
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-date/10 bg-date p-6 text-cream shadow-soft">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream/10 text-saffron">
              <Truck size={21} />
            </span>
            <div>
              <h2 className="font-display text-3xl font-semibold">Delivery fee</h2>
              <p className="mt-2 text-sm leading-6 text-cream/70">Set the fee your client wants to charge per mile.</p>
            </div>
          </div>

          <label className="mt-6 block text-sm font-semibold text-cream/80">
            Fee per mile
            <div className="mt-1 flex overflow-hidden rounded-md border border-cream/15 bg-cream text-date">
              <span className="flex items-center border-r border-date/10 px-4 text-sm text-date/55">£</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={(settings.deliveryFeePerMilePence / 100).toString()}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    deliveryFeePerMilePence: Math.round(Number(event.target.value) * 100)
                  }))
                }
                className="focus-ring w-full border-0 px-4 py-3 font-normal"
              />
            </div>
          </label>

          <div className="mt-5 rounded-md bg-cream/10 p-4 text-sm leading-6 text-cream/75">
            <p>Current fee: <strong className="text-cream">{money(deliveryPreview.fee)} per mile</strong></p>
            <p>Radius: <strong className="text-cream">{deliveryPreview.radius} miles</strong></p>
            <p>Maximum delivery fee inside radius: <strong className="text-cream">{money(deliveryPreview.maxFee)}</strong></p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-date/10 bg-cream/95 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-date/70">
          <CheckCircle2 className="text-mint" size={20} />
          <span>Changes apply to customer checkout after saving.</span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-60"
        >
          <Save size={17} /> {saving ? "Saving..." : "Save settings"}
        </button>
      </div>

      {message ? <p className="rounded-md bg-mint/10 p-3 text-sm font-semibold text-mint">{message}</p> : null}
    </section>
  );
}
