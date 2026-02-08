"use client";

import { useState, useTransition } from "react";

type WorkingDay = { dateISO: string; dayOfMonth: number };

type Row = {
  subject: string;
  className: string;
  hours: string;
  byDay: Record<string, string>; // dateISO -> "2" / "1.5" etc
};

export default function ExtraHoursTable({
  workingDays,
  fullName,
  workAddress,
}: {
  workingDays: WorkingDay[];
  fullName: string;
  workAddress: string;
}) {
  const [isPending, startTransition] = useTransition();

  const emptyRow = (): Row => ({
    subject: "",
    className: "",
    hours: "",
    byDay: Object.fromEntries(workingDays.map((d) => [d.dateISO, ""])),
  });

  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow()]);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  function updateDay(i: number, dateISO: string, value: string) {
    setRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, byDay: { ...r.byDay, [dateISO]: value } } : r,
      ),
    );
  }

  function addRow() {
    if (rows.length < 8) {
      setRows((prev) => [...prev, emptyRow()]);
    }
  }

  async function download() {
    startTransition(async () => {
      const payload = {
        rows: rows.map((r) => ({
          subject: r.subject,
          className: r.className,
          hours: r.hours,
          byDay: r.byDay,
        })),
      };

      const res = await fetch("/api/extra-hours/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        alert(`Preuzimanje nije uspjelo. ${msg}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "honorari.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
          type="button"
          onClick={download}
          disabled={isPending}
        >
          {isPending ? "Pripremanje..." : "Preuzmi"}
        </button>
        <div className="text-sm text-gray-600">
          Nastavnik: <b>{fullName || "—"}</b>
          <span className="mx-2">•</span>
          Adresa rada: <b>{workAddress || "—"}</b>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-center p-3">Nastavni predmet</th>
              <th className="text-center p-3">Razred</th>
              <th className="text-center p-3">Sati</th>
              {workingDays.map((d) => (
                <th
                  key={d.dateISO}
                  className="text-center p-3 whitespace-nowrap"
                >
                  {d.dayOfMonth}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">
                  <input
                    className="w-36 rounded-xl border px-3 py-2"
                    value={r.subject}
                    onChange={(e) => updateRow(i, { subject: e.target.value })}
                  />
                </td>

                <td className="p-1">
                  <input
                    className="w-20 rounded-xl border px-3 py-2"
                    value={r.className}
                    onChange={(e) =>
                      updateRow(i, { className: e.target.value })
                    }
                  />
                </td>

                <td className="p-1">
                  <input
                    className="w-15 rounded-xl border px-3 py-2 bg-gray-50"
                    value={r.hours}
                    onChange={(e) => updateRow(i, { hours: e.target.value })}
                  />
                </td>

                {workingDays.map((d) => (
                  <td key={d.dateISO} className="p-1">
                    <input
                      className="text-center w-11 rounded-xl border px-3 py-2"
                      inputMode="decimal"
                      placeholder="0"
                      value={r.byDay[d.dateISO] ?? ""}
                      onChange={(e) => updateDay(i, d.dateISO, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="rounded-xl border px-4 py-2 text-sm"
        type="button"
        onClick={addRow}
      >
        + Novi redak
      </button>

      <div className="text-xs text-gray-500">
        Napomena: Upišite broj sati za svaki od navedenih radnih dana u mjesecu.
      </div>
    </div>
  );
}
