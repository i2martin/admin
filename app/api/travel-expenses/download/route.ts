import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import * as XLSX from "xlsx";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RowInput = {
  dateISO: string; // YYYY-MM-DD
  included: boolean;
  transport: string;
};

function hrDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}.`;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const HR_MONTHS_UPPER = [
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });
  if (!user?.settings)
    return new NextResponse("Missing settings", { status: 400 });

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

  // Header month based on first row date (or today)
  const baseDate = rows[0]?.dateISO ? new Date(rows[0].dateISO) : new Date();
  ws["A9"] = {
    t: "s",
    v: `Datum \n mjesec ${HR_MONTHS_UPPER[baseDate.getMonth()]} -  ${baseDate.getFullYear()}`,
  };

  // Settings text
  ws["A5"] = { t: "s", v: `Ime i prezime zaposlenika: ${s.fullName ?? ""}` };
  ws["A6"] = { t: "s", v: `Adresa rada: ${s.workAddress ?? ""}` };
  ws["A7"] = { t: "s", v: `Adresa stanovanja: ${s.homeAddress ?? ""}` };
  ws["B38"] = { t: "n", v: pricePerKm };

  // Clear rows 10..33
  const START_ROW = 10;
  const END_ROW = 33;
  const MAX = END_ROW - START_ROW + 1;

  for (let r = START_ROW; r <= END_ROW; r++) {
    delete ws[`A${r}`];
    delete ws[`B${r}`];
    delete ws[`C${r}`];
    delete ws[`D${r}`];
    delete ws[`E${r}`];
  }

  // Fill (keep row positions; excluded blank)
  let sumTo = 0;
  let sumFrom = 0;

  for (let i = 0; i < MAX; i++) {
    const excelRow = START_ROW + i;
    const item = rows[i];
    if (!item) continue;
    if (!item.included) continue;

    const d = new Date(item.dateISO);
    ws[`A${excelRow}`] = { t: "s", v: hrDate(d) };
    ws[`B${excelRow}`] = { t: "n", v: kmTo };
    ws[`C${excelRow}`] = { t: "n", v: kmFrom };
    ws[`D${excelRow}`] = { t: "s", v: item.transport ?? "" };

    sumTo += kmTo;
    sumFrom += kmFrom;
  }

  const totalKm = sumTo + sumFrom;

  // Totals as NUMBERS (no formulas)
  ws["B34"] = { t: "n", v: sumTo };
  ws["C34"] = { t: "n", v: sumFrom };
  ws["D34"] = { t: "n", v: totalKm };

  // A37 + A43
  ws["A37"] = { t: "s", v: `DATUM PODNOŠENJA IZVJEŠĆA: ${hrDate(new Date())}` };

  const amount = round2(pricePerKm * totalKm);
  ws["A43"] = { t: "s", v: `Odobreni iznos za isplatu: ${amount} EUR` };

  // Output
  const out = XLSX.write(wb, { type: "buffer", bookType: "biff8" });
  return new NextResponse(out, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="prijevoz.xls"`,
      "Cache-Control": "no-store",
    },
  });
}
