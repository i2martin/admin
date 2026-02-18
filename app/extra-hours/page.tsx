import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExtraHoursTable from "./extra-hours-table";

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}

function workingDaysOfMonth(d: Date) {
  const { start, end } = monthRange(d);
  const days: Date[] = [];
  for (let cur = new Date(start); cur < end; cur.setDate(cur.getDate() + 1)) {
    const dow = cur.getDay();
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

export default async function ExtraHoursPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return <div className="p-6">Niste autentificirani</div>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });
  if (!user) return <div className="p-6">Korisnik nije pronađen</div>;

  const now = new Date();
  const days = workingDaysOfMonth(now).map((d) => ({
    dateISO: isoDate(d),
    dayOfMonth: d.getDate(),
  }));

  const currentMonthAndYear = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Prekovremeni sati za mjesec {currentMonthAndYear}
      </h1>
      <ExtraHoursTable
        workingDays={days}
        fullName={user.settings?.fullName ?? ""}
        workAddress={user.settings?.workAddress ?? ""}
      />
    </main>
  );
}
