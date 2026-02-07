import * as XLSX from "xlsx-js-style";

export const wrapTop = {
  alignment: { wrapText: true, vertical: "center", horizontal: "center" },
};

export const headerStyling = {
  font: { sz: 12, bold: true },
  alignment: {
    horizontal: "center",
    vertical: "center",
  },
};

export const VHAlignment = {
  alignment: {
    horizontal: "center",
    vertical: "center",
  },
};

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function hrDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}.`;
}

export const HR_MONTHS_UPPER = [
  "SIJEČANJ",
  "VELJAČA",
  "OŽUJAK",
  "TRAVANJ",
  "SVIBANJ",
  "LIPANJ",
  "SRPANJ",
  "KOLOVOZ",
  "RUJAN",
  "LISTOPAD",
  "STUDENI",
  "PROSINAC",
];

export type RowInput = {
  dateISO: string; // YYYY-MM-DD
  included: boolean;
  transport: string;
};

export function addGrid(ws: XLSX.WorkSheet, range: string, style = "thin") {
  const r = XLSX.utils.decode_range(range);

  for (let row = r.s.r; row <= r.e.r; row++) {
    for (let col = r.s.c; col <= r.e.c; col++) {
      const addr = XLSX.utils.encode_cell({ r: row, c: col });
      ws[addr] = ws[addr] || { t: "s", v: "" };

      ws[addr].s = {
        ...(ws[addr].s || {}),
        border: {
          top: { style },
          bottom: { style },
          left: { style },
          right: { style },
        },
      };
    }
  }
}

export function lastWorkingDayOfMonth(date: Date): Date {
  // last calendar day of the month
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // move backwards if weekend
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }

  return d;
}
