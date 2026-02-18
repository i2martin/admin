"use client";

import { useState, useTransition } from "react";
import { saveSettings } from "./actions";

const TRANSPORTS = ["osobni automobil", "autobus", "vlak", "tramvaj"];

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
    organisationName: string;
    ticketPrice?: string;
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
        setStatus("Spremljeno ✅");
        setTimeout(() => setStatus(null), 1500);
      } catch {
        setStatus("Spremanje nije uspjelo ❌");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border p-4 space-y-3">
        <div>
          <label className="text-sm font-medium">Ime i prezime</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Naziv organizacije/škole
          </label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.organisationName}
            onChange={(e) => set("organisationName", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Adresa stanovanja</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.homeAddress}
            onChange={(e) => set("homeAddress", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Adresa rada</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.workAddress}
            onChange={(e) => set("workAddress", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">
              Udaljenost do radnog mjesta (km)
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              inputMode="decimal"
              placeholder="npr. 12.5"
              value={form.distanceToWork}
              onChange={(e) => set("distanceToWork", e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-1">
              Dozvoljeni formati “12,5” ili “12.5”.
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Udaljenost pri povratku s randog mjesta (km)
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              inputMode="decimal"
              placeholder="npr. 12.5"
              value={form.distanceFromWork}
              onChange={(e) => set("distanceFromWork", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Naknada po kilometru (EUR)
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              inputMode="decimal"
              placeholder="npr. 0.16"
              value={form.pricePerKm}
              onChange={(e) => set("pricePerKm", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Cijena mjesečne karte (EUR)
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              inputMode="decimal"
              placeholder="npr. 45.00"
              value={form.ticketPrice}
              onChange={(e) => set("ticketPrice", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Prijevozno sredstvo</label>
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
            {isPending ? "Spremanje..." : "Spremi"}
          </button>
          {status && <span className="text-sm text-gray-700">{status}</span>}
        </div>
      </div>
    </div>
  );
}
