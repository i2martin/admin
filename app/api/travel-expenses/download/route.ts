import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import * as XLSX from "xlsx-js-style";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  hrDate,
  round2,
  wrapTop,
  headerStyling,
  HR_MONTHS_UPPER,
  RowInput,
  addGrid,
  VHAlignment,
  lastWorkingDayOfMonth,
} from "@/app/api/travel-expenses/download/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });
  if (!user?.settings) {
    return new NextResponse("Missing settings", { status: 400 });
  }

  const body = (await req.json()) as { rows?: RowInput[] };
  const rows = body.rows ?? [];
  const s = user.settings;

  const kmTo = s.distanceToWork != null ? Number(s.distanceToWork) : 0;
  const kmFrom = s.distanceFromWork != null ? Number(s.distanceFromWork) : 0;
  const pricePerKm = s.pricePerKm != null ? Number(s.pricePerKm) : 0;

  // Load template
  const templatePath = path.join(process.cwd(), "templates", "Prijevoz.xlsx");
  const templateBuffer = await fs.readFile(templatePath);

  const wb = XLSX.read(templateBuffer, { type: "buffer" });

  const sheetName = wb.SheetNames.includes("obrazac")
    ? "obrazac"
    : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Column widths
  ws["!cols"] = [
    { wch: 20 }, // A - Date
    { wch: 15 }, // B - Distance to work
    { wch: 15 }, // C - Distance from work
    { wch: 18 }, // D - Transport
    { wch: 18 }, // E
  ];

  // Header month based on first row date (or today)
  const baseDate = rows[0]?.dateISO ? new Date(rows[0].dateISO) : new Date();

  ws["A1"] = {
    t: "s",
    v: `IZVJEŠĆE O PRIJEĐENOJ UDALJENOSTI`,
    s: headerStyling,
  };

  ws["A2"] = {
    t: "s",
    v: `PRI DOLASKU NA POSAO I ODLASKU S POSLA`,
    s: headerStyling,
  };

  ws["A3"] = {
    t: "s",
    v: `(stavak 15. članak 75. Temeljnog kolektivnog ugovora za službenike i namještenike u javnim službama )`,
    s: {
      font: { sz: 10 },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    },
  };

  ws["A9"] = {
    t: "s",
    v: `Datum \n mjesec ${HR_MONTHS_UPPER[baseDate.getMonth()]} - ${baseDate.getFullYear()}`,
    s: wrapTop,
  };
  ws["B9"] = {
    t: "s",
    v: `Broj prijeđenih kilometara pri dolasku`,
    s: wrapTop,
  };
  ws["C9"] = {
    t: "s",
    v: `Broj prijeđenih kilometara pri odlasku`,
    s: wrapTop,
  };
  ws["D9"] = {
    t: "s",
    v: `Prijevozno sredstvo`,
    s: wrapTop,
  };
  ws["E9"] = {
    t: "s",
    v: `Potpis`,
    s: wrapTop,
  };

  ws["!rows"] = ws["!rows"] || [];
  ws["!rows"][8] = { hpt: 45 };
  ws["!rows"][35] = { hpt: 30 };
  ws["!rows"][36] = { hpt: 30 };
  ws["!rows"][37] = { hpt: 30 };
  ws["!rows"][38] = { hpt: 30 };
  ws["!rows"][39] = { hpt: 30 };

  ws["A5"] = {
    t: "s",
    v: `Ime i prezime zaposlenika: ${s.fullName ?? ""}`,
  };
  ws["A6"] = {
    t: "s",
    v: `Adresa rada: ${s.workAddress ?? ""}`,
  };
  ws["A7"] = {
    t: "s",
    v: `Adresa stanovanja: ${s.homeAddress ?? ""}`,
  };

  ws["B33"] = {
    t: "s",
    v: `1`,
    s: VHAlignment,
  };

  ws["C33"] = {
    t: "s",
    v: `2`,
    s: VHAlignment,
  };

  ws["D33"] = {
    t: "s",
    v: `1+2`,
    s: VHAlignment,
  };

  ws["A38"] = {
    t: "s",
    v: `Naknada po prijeđenom kilometru: ${pricePerKm ?? ""} EUR`,
  };

  ws["D40"] = {
    t: "s",
    v: `______________________`,
  };
  ws["D43"] = {
    t: "s",
    v: `______________________`,
  };

  // Clear rows 10..33
  const START_ROW = 10;
  const END_ROW = 32;
  const MAX = END_ROW - START_ROW + 1;

  // Fill (keep row positions; excluded blank)
  let sumTo = 0;
  let sumFrom = 0;

  let writtenRows = 0;
  for (let i = 0; i < MAX; i++) {
    const item = rows[i];
    if (!item) continue;
    if (!item.included) continue;
    const excelRow = START_ROW + writtenRows;
    writtenRows++;
    const d = new Date(item.dateISO);
    ws[`A${excelRow}`] = { t: "s", v: hrDate(d), s: VHAlignment };
    ws[`B${excelRow}`] = { t: "n", v: kmTo, s: VHAlignment };
    ws[`C${excelRow}`] = { t: "n", v: kmFrom, s: VHAlignment };
    ws[`D${excelRow}`] = { t: "s", v: item.transport ?? "", s: VHAlignment };

    sumTo += kmTo;
    sumFrom += kmFrom;
  }

  const totalKm = sumTo + sumFrom;

  ws["B34"] = { t: "n", v: sumTo, s: VHAlignment };
  ws["C34"] = { t: "n", v: sumFrom, s: VHAlignment };
  ws["D34"] = { t: "n", v: totalKm, s: VHAlignment };

  ws["A36"] = {
    t: "s",
    v: `Za točnost i istinitost podataka iz ovog izvješća zaposlenik jamči potpisom pod punom krivičnom i materijalnom odgovornošću.`,
    s: wrapTop,
  };

  ws["A37"] = {
    t: "s",
    v: `DATUM PODNOŠENJA IZVJEŠĆA: ${hrDate(lastWorkingDayOfMonth(new Date()))}`,
  };

  const amount = round2(pricePerKm * totalKm);
  ws["A39"] = {
    t: "s",
    v: `Na ime naknade troška prijevoza potražujem: ${amount} EUR`,
  };

  addGrid(ws, "A9:E34");

  const out = XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(out, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="prijevoz.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
