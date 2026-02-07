"use client";

import { useMemo, useState, useTransition } from "react";

type Row = {
  dateISO: string; // YYYY-MM-DD
  included: boolean;
  transport: string;
};

const TRANSPORTS = ["car", "bus", "train", "tram", "bike", "walk", "other"];

function formatHRFromISO(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}.`;
}

export default function TravelTable({
  initialRows,
  fixedDistanceToWork,
  fixedDistanceFromWork,
  pricePerKm,
}: {
  initialRows: Row[];
  fixedDistanceToWork: number;
  fixedDistanceFromWork: number;
  pricePerKm: number;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [isPending, startTransition] = useTransition();

  const rowsWithDow = useMemo(
    () =>
      rows.map((r) => {
        const d = new Date(r.dateISO);
        return { ...r, _dow: d.getDay() };
      }),
    [rows],
  );

  function setAllIncluded(included: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, included })));
  }

  function setIncludedForDow(dow: number, included: boolean) {
    setRows((prev) =>
      prev.map((r) =>
        new Date(r.dateISO).getDay() === dow ? { ...r, included } : r,
      ),
    );
  }

  function updateRow(dateISO: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.dateISO === dateISO ? { ...r, ...patch } : r)),
    );
  }

  async function download() {
    startTransition(async () => {
      const res = await fetch("/api/travel-expenses/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        alert(`Download failed. ${msg}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "prijevoz.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  const kmTo = fixedDistanceToWork ?? 0;
  const kmFrom = fixedDistanceFromWork ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          type="button"
          onClick={() => setAllIncluded(true)}
        >
          Select all
        </button>
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          type="button"
          onClick={() => setAllIncluded(false)}
        >
          Unselect all
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <button
          className="rounded-xl border px-3 py-2 text-sm"
          type="button"
          onClick={() => setIncludedForDow(1, true)}
        >
          All Mondays
        </button>
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          type="button"
          onClick={() => setIncludedForDow(2, true)}
        >
          All Tuesdays
        </button>
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          type="button"
          onClick={() => setIncludedForDow(3, true)}
        >
          All Wednesdays
        </button>
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          type="button"
          onClick={() => setIncludedForDow(4, true)}
        >
          All Thursdays
        </button>
        <button
          className="rounded-xl border px-3 py-2 text-sm"
          type="button"
          onClick={() => setIncludedForDow(5, true)}
        >
          All Fridays
        </button>

        <div className="flex-1" />

        <button
          className="rounded-xl bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
          type="button"
          onClick={download}
          disabled={isPending}
        >
          {isPending ? "Preparing..." : "Download"}
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Distances (fixed from settings): to work <b>{kmTo}</b> km, from work{" "}
        <b>{kmFrom}</b> km, price/km <b>{pricePerKm}</b> EUR
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Distance to work (km)</th>
              <th className="text-left p-3">Distance from work (km)</th>
              <th className="text-left p-3">Transport</th>
              <th className="text-left p-3">Include</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithDow.map((r) => (
              <tr key={r.dateISO} className="border-t">
                <td className="p-3 whitespace-nowrap">
                  {formatHRFromISO(r.dateISO)}
                </td>
                <td className="p-3">
                  <input
                    className="w-36 rounded-xl border px-3 py-2 bg-gray-50"
                    value={kmTo}
                    readOnly
                  />
                </td>
                <td className="p-3">
                  <input
                    className="w-36 rounded-xl border px-3 py-2 bg-gray-50"
                    value={kmFrom}
                    readOnly
                  />
                </td>
                <td className="p-3">
                  <select
                    className="rounded-xl border px-3 py-2"
                    value={r.transport}
                    onChange={(e) =>
                      updateRow(r.dateISO, { transport: e.target.value })
                    }
                  >
                    {TRANSPORTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={r.included}
                    onChange={(e) =>
                      updateRow(r.dateISO, { included: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
