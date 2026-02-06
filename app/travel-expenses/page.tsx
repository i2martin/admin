import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TravelTable from "./travel-table";

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}

function workingDaysOfMonth(d: Date) {
  const { start, end } = monthRange(d);
  const days: Date[] = [];
  for (let cur = new Date(start); cur < end; cur.setDate(cur.getDate() + 1)) {
    const dow = cur.getDay(); // 0 Sun ... 6 Sat
    if (dow >= 1 && dow <= 5) days.push(new Date(cur));
  }
  return days;
}

function isoDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function TravelExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return <div className="p-6">Not authenticated</div>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });
  if (!user) return <div className="p-6">User not found</div>;

  const now = new Date();
  const days = workingDaysOfMonth(now);

  const s = user.settings;

  const fixedTo =
    s?.distanceToWork !== null && s?.distanceToWork !== undefined
      ? Number(s.distanceToWork)
      : 0;

  const fixedFrom =
    s?.distanceFromWork !== null && s?.distanceFromWork !== undefined
      ? Number(s.distanceFromWork)
      : 0;

  const pricePerKm =
    s?.pricePerKm !== null && s?.pricePerKm !== undefined
      ? Number(s.pricePerKm)
      : 0;

  const defaultTransport = s?.defaultTransport ?? "car";

  const rows = days.map((d) => ({
    dateISO: isoDate(d),
    included: true,
    transport: defaultTransport,
  }));

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Travel expenses</h1>

      <TravelTable
        initialRows={rows}
        fixedDistanceToWork={fixedTo}
        fixedDistanceFromWork={fixedFrom}
        pricePerKm={pricePerKm}
      />
    </main>
  );
}
