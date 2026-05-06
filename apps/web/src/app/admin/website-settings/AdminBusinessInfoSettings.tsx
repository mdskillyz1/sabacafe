"use client";

import { useEffect, useState } from "react";
import { AtSign, Building2, Clock, Link as LinkIcon, MapPin, Phone, Save, type LucideIcon } from "lucide-react";
import { defaultBusinessInfoSettings, type BusinessInfoSettings } from "@saba/shared";

type Errors = Partial<Record<keyof BusinessInfoSettings | "instagram" | "tiktok", string>>;

function Field({
  label,
  value,
  onChange,
  error,
  icon: Icon,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon: LucideIcon;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-date/75">
      {label}
      <span className="mt-1 flex overflow-hidden rounded-md border border-date/15 bg-white focus-within:ring-2 focus-within:ring-mint">
        <span className="flex items-center border-r border-date/10 px-3 text-date/45">
          <Icon size={17} />
        </span>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border-0 px-4 py-3 font-normal outline-none"
        />
      </span>
      {error ? <span className="mt-1 block text-xs font-semibold text-red-700">{error}</span> : null}
    </label>
  );
}

export function AdminBusinessInfoSettings() {
  const [settings, setSettings] = useState<BusinessInfoSettings>(defaultBusinessInfoSettings);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/business-info", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setSettings(data))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof BusinessInfoSettings>(key: K, value: BusinessInfoSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setErrors({});
    const response = await fetch("/api/admin/business-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setErrors(result.errors ?? {});
      setMessage("Please fix the highlighted fields.");
      return;
    }

    setSettings(result);
    setMessage("Saved. The public footer now uses this business information.");
  }

  if (loading) {
    return <p className="mt-8 rounded-lg border border-date/10 bg-white p-6 text-date/65">Loading website settings...</p>;
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-date/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-saffron/15 text-clay">
            <Building2 size={21} />
          </span>
          <div>
            <h2 className="font-display text-3xl font-semibold text-date">Business info</h2>
            <p className="mt-2 text-sm leading-6 text-date/65">
              These details power the customer footer, contact links, and structured business data.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Business name" value={settings.businessName} onChange={(value) => update("businessName", value)} error={errors.businessName} icon={Building2} />
          <Field label="Phone number" value={settings.phone} onChange={(value) => update("phone", value)} error={errors.phone} icon={Phone} />
          <Field label="Email" type="email" value={settings.email} onChange={(value) => update("email", value)} error={errors.email} icon={AtSign} />
          <Field label="Opening hours text" value={settings.openingHoursText} onChange={(value) => update("openingHoursText", value)} error={errors.openingHoursText} icon={Clock} />
          <div className="sm:col-span-2">
            <Field label="Address" value={settings.address} onChange={(value) => update("address", value)} error={errors.address} icon={MapPin} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Copyright text" value={settings.copyrightText} onChange={(value) => update("copyrightText", value)} error={errors.copyrightText} icon={LinkIcon} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-date/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-3xl font-semibold text-date">Social links</h2>
          <p className="mt-2 text-sm leading-6 text-date/65">Leave these blank if the cafe does not want to show them yet.</p>
          <div className="mt-5 space-y-4">
            <Field
              label="Instagram URL"
              value={settings.socialLinks.instagram ?? ""}
              placeholder="https://www.instagram.com/sabacafe"
              onChange={(value) => update("socialLinks", { ...settings.socialLinks, instagram: value })}
              error={errors.instagram}
              icon={LinkIcon}
            />
            <Field
              label="TikTok URL"
              value={settings.socialLinks.tiktok ?? ""}
              placeholder="https://www.tiktok.com/@sabacafe"
              onChange={(value) => update("socialLinks", { ...settings.socialLinks, tiktok: value })}
              error={errors.tiktok}
              icon={LinkIcon}
            />
          </div>
        </div>

        <div className="rounded-lg border border-date/10 bg-date p-6 text-cream shadow-soft">
          <h2 className="font-display text-3xl font-semibold">Footer preview</h2>
          <div className="mt-5 rounded-md bg-cream p-4 text-sm leading-6 text-date">
            <p className="font-display text-2xl font-semibold">{settings.businessName}</p>
            <p className="mt-3 text-date/70">{settings.address}</p>
            <p className="text-date/70">{settings.email}</p>
            <p className="text-date/70">{settings.phone}</p>
            <p className="text-date/70">{settings.openingHoursText}</p>
            <p className="mt-4 text-date/55">{settings.copyrightText}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-date px-5 py-3 font-semibold text-cream disabled:opacity-60"
        >
          <Save size={17} /> {saving ? "Saving..." : "Save website settings"}
        </button>
        {message ? <p className={`rounded-md p-3 text-sm font-semibold ${Object.keys(errors).length ? "bg-red-50 text-red-700" : "bg-mint/10 text-mint"}`}>{message}</p> : null}
      </div>
    </section>
  );
}
