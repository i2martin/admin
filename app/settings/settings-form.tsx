"use client";

import { useState, useTransition } from "react";
import { saveSettings } from "./actions";

const TRANSPORTS = ["car", "bus", "train", "tram", "bike", "walk", "other"];

export default function SettingsForm({
  initial,
}: {
  initial: {
    fullName: string;
    homeAddress: string;
    workAddress: string;
    distanceToWork: string;
    distanceFromWork: string;
    pricePerKm: string;
    defaultTransport: string;
  };
}) {
  const [form, setForm] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function onSave() {
    setStatus(null);
    startTransition(async () => {
      try {
        await saveSettings(form);
        setStatus("Saved ✅");
        setTimeout(() => setStatus(null), 1500);
      } catch {
        setStatus("Save failed ❌");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border p-4 space-y-3">
        <div>
          <label className="text-sm font-medium">Full name</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Home address</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.homeAddress}
            onChange={(e) => set("homeAddress", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Work address</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.workAddress}
            onChange={(e) => set("workAddress", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Distance to work (km)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              inputMode="decimal"
              placeholder="e.g. 12.5"
              value={form.distanceToWork}
              onChange={(e) => set("distanceToWork", e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-1">
              You can use “12,5” or “12.5”.
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Distance from work (km)
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              inputMode="decimal"
              placeholder="e.g. 12.5"
              value={form.distanceFromWork}
              onChange={(e) => set("distanceFromWork", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Price per km (EUR)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              inputMode="decimal"
              placeholder="e.g. 0.21"
              value={form.pricePerKm}
              onChange={(e) => set("pricePerKm", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Default transport</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={form.defaultTransport}
              onChange={(e) => set("defaultTransport", e.target.value)}
            >
              {TRANSPORTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            className="rounded-xl bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
            onClick={onSave}
            disabled={isPending}
            type="button"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          {status && <span className="text-sm text-gray-700">{status}</span>}
        </div>
      </div>
    </div>
  );
}
