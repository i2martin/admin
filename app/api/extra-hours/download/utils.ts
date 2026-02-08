import * as XLSX from "xlsx-js-style";

export const wrapLeft = {
  alignment: { wrapText: true, vertical: "center", horizontal: "left" },
};

export const VHAlignment = {
  alignment: {
    horizontal: "center",
    vertical: "center",
  },
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
