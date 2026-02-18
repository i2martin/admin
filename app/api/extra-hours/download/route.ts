import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import * as XLSX from "xlsx-js-style";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addGrid, wrapLeft, VHAlignment } from "./utils";

type RowInput = {
  subject: string;
  className: string;
  hours: string;
  byDay: Record<string, string>; // dateISO -> hours (string "1.5" / "2" / "")
};

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}

function workingDaysOfMonth(d: Date) {
  const { start, end } = monthRange(d);
  const out: { dateISO: string; dayOfMonth: number }[] = [];
  for (let cur = new Date(start); cur < end; cur.setDate(cur.getDate() + 1)) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, "0");
      const dd = String(cur.getDate()).padStart(2, "0");
      out.push({ dateISO: `${yyyy}-${mm}-${dd}`, dayOfMonth: cur.getDate() });
    }
  }
  return out;
}

function parseNum(v: string): number {
  const t = (v ?? "").trim();
  if (!t) return 0;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function setCell(ws: XLSX.WorkSheet, addr: string, cell: XLSX.CellObject) {
  ws[addr] = cell;
}

function clearRange(
  ws: XLSX.WorkSheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const a = XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
      delete ws[a];
    }
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await req.json()) as { rows?: RowInput[] };
  const rows = (body.rows ?? []).filter(
    (r) => r.subject.trim() || r.className.trim() || r.hours.trim(),
  );

  const now = new Date();
  const workingDays = workingDaysOfMonth(now);

  // Load .xls template
  const templatePath = path.join(process.cwd(), "templates", "Honorari.xlsx");
  const buf = await fs.readFile(templatePath);

  const wb = XLSX.read(buf, { type: "buffer" });

  // Choose sheet: if you know the name, set it; else use first
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // ---------------------------
  // TEMPLATE MAPPING (ADJUST IF NEEDED)
  // ---------------------------
  // Header day numbers row: row 10, starting col D (4)
  const HEADER_ROW = 10;
  const FIRST_DAY_COL = 4; // D
  const MAX_DAY_COLS = 24; // D.. (24 workday columns in template)

  // Data starts at row 12
  const DATA_START_ROW = 12;

  // "Total per row" at AB (28) in your xlsx template; for xls, confirm later
  // We'll still set AB as 28 for now.
  const TOTAL_RIGHT_COL = 28; // AB

  // Cell spec.
  const TEACHER_CELL = "F7";
  const MONTH_CELL = "K5";
  const WORK_ADDRESS_CELL = "A4";
  const ORGANISATION_NAME_CELL = "A3";
  // ---------------------------

  // Fill teacher name from settings
  setCell(ws, TEACHER_CELL, { t: "s", v: user.settings?.fullName ?? "" });
  setCell(ws, ORGANISATION_NAME_CELL, {
    t: "s",
    v: user.settings?.organisationName ?? "",
  });
  setCell(ws, WORK_ADDRESS_CELL, {
    t: "s",
    v: user.settings?.workAddress ?? "",
  });

  // Month label (e.g. "02/2026")
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  setCell(ws, MONTH_CELL, { t: "s", v: `${mm}/${yyyy}`, s: VHAlignment });

  // Clear header day numbers area
  for (let i = 0; i < MAX_DAY_COLS; i++) {
    const addr = XLSX.utils.encode_cell({
      r: HEADER_ROW - 1,
      c: FIRST_DAY_COL - 1 + i,
    });
    delete ws[addr];
  }

  // Write working day numbers
  for (let i = 0; i < Math.min(workingDays.length, MAX_DAY_COLS); i++) {
    const addr = XLSX.utils.encode_cell({
      r: HEADER_ROW - 1,
      c: FIRST_DAY_COL - 1 + i,
    });
    setCell(ws, addr, {
      t: "n",
      v: workingDays[i].dayOfMonth,
      s: { alignment: { horizontal: "center", vertical: "center" } },
    });
  }

  // Clear data block (we’ll clear enough rows for what you might enter)
  const rowsToClear = Math.max(6, rows.length); // template probably has 6 default rows
  clearRange(
    ws,
    DATA_START_ROW,
    DATA_START_ROW + rowsToClear + 5,
    1, // A
    TOTAL_RIGHT_COL + 1, // AB/AC area
  );

  // Fill rows
  let grandTotal = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = DATA_START_ROW + i;
    const row = rows[i];

    // A = subject, B = class, C = hours
    setCell(ws, XLSX.utils.encode_cell({ r: r - 1, c: 0 }), {
      t: "s",
      v: row.subject,
      s: wrapLeft,
    });
    setCell(ws, XLSX.utils.encode_cell({ r: r - 1, c: 1 }), {
      t: "s",
      v: row.className,
      s: wrapLeft,
    });
    setCell(ws, XLSX.utils.encode_cell({ r: r - 1, c: 2 }), {
      t: "s",
      v: row.hours,
      s: wrapLeft,
    });
    let total = 0;

    for (let d = 0; d < Math.min(workingDays.length, MAX_DAY_COLS); d++) {
      const dateISO = workingDays[d].dateISO;
      const val = parseNum(row.byDay?.[dateISO] ?? "");
      total += val;

      if (val !== 0) {
        const addr = XLSX.utils.encode_cell({
          r: r - 1,
          c: FIRST_DAY_COL - 1 + d,
        });
        setCell(ws, addr, {
          t: "n",
          v: val,
          s: { alignment: { horizontal: "center", vertical: "center" } },
        });
      }
    }

    // AB = total hours (number) (if your template has it there)
    setCell(ws, XLSX.utils.encode_cell({ r: r - 1, c: TOTAL_RIGHT_COL - 1 }), {
      t: "n",
      v: total,
      s: { alignment: { horizontal: "center", vertical: "center" } },
    });

    grandTotal += total;
  }

  // If your template has a "UKUPNO" row, we can set it too.
  // For now we assume it is DATA_START_ROW + 6 (like your previous template). Adjust once you provide .xls.
  const UKUPNO_ROW = DATA_START_ROW + 8;

  ws["!rows"] = ws["!rows"] || [];
  ws["!rows"][11] = { hpt: 30 };
  ws["!rows"][12] = { hpt: 30 };
  ws["!rows"][13] = { hpt: 30 };
  ws["!rows"][14] = { hpt: 30 };
  ws["!rows"][15] = { hpt: 30 };
  ws["!rows"][16] = { hpt: 30 };
  ws["!rows"][17] = { hpt: 30 };
  ws["!rows"][18] = { hpt: 30 };
  ws["!rows"][19] = { hpt: 30 };

  ws["J3"] = {
    t: "s",
    v: `TABLICA`,
    s: VHAlignment,
  };

  ws["G4"] = {
    t: "s",
    v: `za održane honorarne sate u mjesecu`,
    s: VHAlignment,
  };

  ws["D11"] = {
    t: "s",
    v: `ODRŽANO SATI`,
    s: VHAlignment,
  };

  ws["D9"] = {
    t: "s",
    v: `DATUM ODRŽANOG PREDAVANJA`,
    s: VHAlignment,
  };

  ws["J23"] = {
    t: "s",
    v: `Ovjera ravnatelja`,
    s: VHAlignment,
  };

  ws["X23"] = {
    t: "s",
    v: `Potpis podnositelja`,
    s: VHAlignment,
  };
  setCell(
    ws,
    XLSX.utils.encode_cell({ r: UKUPNO_ROW - 1, c: TOTAL_RIGHT_COL - 1 }),
    {
      t: "n",
      v: grandTotal,
      s: { alignment: { horizontal: "center", vertical: "center" } },
    },
  );

  // Optional: widen columns a bit so values fit
  ws["!cols"] = [
    { wch: 32 }, // A subject
    { wch: 10 }, // B class
    { wch: 5 }, // C total
    ...Array.from({ length: MAX_DAY_COLS }, () => ({ wch: 2 })), // day columns
    { wch: 3 }, // AB total
  ];

  addGrid(ws, "A9:AC20");

  const out = XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
  });
  return new NextResponse(out, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="honorari.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
