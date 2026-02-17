import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MapWithOverlay } from "./MapWithOverlay";
import { orsGeocodeOne } from "@/lib/orsGeocode";
export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return <div className="p-6">Not authenticated</div>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });

  if (!user) return <div className="p-6">Korisnik nije pronađen</div>;

  if (!user?.settings) {
    return (
      <main className="p-8 max-w-6xl mx-auto">
        <p className="text-red-500">
          Nedostaju postavke korisnika. Ažurirajte Vaše postavke{" "}
          <Link href="/settings" className="font-semibold">
            ovdje
          </Link>
          .
        </p>
      </main>
    );
  }

  const reportedDistanceKm =
    user.settings.distanceToWork == null
      ? undefined
      : Number(user.settings.distanceToWork);

  const homeAddress = user.settings.homeAddress?.trim() ?? "";
  const workAddress = user.settings.workAddress?.trim() ?? "";

  const [home, work] = await Promise.all([
    orsGeocodeOne(homeAddress),
    orsGeocodeOne(workAddress),
  ]);

  if (!home || !work) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-red-500">
          Nije moguće odrediti položaj upisanih adresa. Molimo provjerite
          unesene adrese i ažurirajte ih.
        </p>
        <p className="text-sm text-slate-600">
          Adresa stanovanja:{" "}
          <span className="font-semibold">{homeAddress || "—"}</span>
          <br />
          Adresa rada:{" "}
          <span className="font-semibold">{workAddress || "—"}</span>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 font-[Inter] flex flex-col">
      {/* Body */}
      <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Card 1 */}
            <div className="group bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-[#135bec]/30">
              <div className="flex items-start justify-between">
                <div className="bg-[#135bec]/10 dark:bg-[#135bec]/20 p-3 rounded-lg text-[#135bec] mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    timer
                  </span>
                </div>
              </div>

              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Prekovremeni sati
              </h4>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Ispunite tablicu s nastavnim predmetima i brojem održanih sati
                te pripremite dokument za ispis.
              </p>
              <Link href="/extra-hours" className="font-semibold">
                <button
                  type="button"
                  className="cursor-pointer w-full flex items-center justify-center gap-2 bg-[#135bec] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    edit_document
                  </span>
                  Ispuni sada
                </button>
              </Link>
            </div>

            {/* Action Card 2 */}
            <div className="group bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-[#135bec]/30">
              <div className="flex items-start justify-between">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-indigo-600 dark:text-indigo-400 mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    directions_car
                  </span>
                </div>
              </div>

              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Evidencija putnih troškova
              </h4>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Evidentirajte radne dane koje ste putovali, odaberite način
                prijevoza i izradite dokument spreman za ispis.
              </p>
              <Link href="/travel-expenses" className="font-semibold">
                <button
                  type="button"
                  className="cursor-pointer w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    edit_document
                  </span>
                  Ispuni sada
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Profile Summary */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Pregled profila
            </h3>

            <button
              type="button"
              className="text-sm text-[#135bec] font-semibold flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-sm">edit</span>

              <Link href="/settings" className="font-semibold">
                Ažuriraj podatke
              </Link>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">
                  info
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Ove informacije se koriste za izračun udaljenosti i naknada.
                  Pobrinite se da su ažurirane kako biste osigurali točne
                  izračune.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-slate-100 dark:divide-slate-800">
              {/* Field 1 */}
              <div className="p-6 border-r-1 border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Ime i prezime
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-800 dark:text-white">
                    {user.settings.fullName || "-"}
                  </p>
                  <span className="material-symbols-outlined text-xs text-green-500">
                    person
                  </span>
                </div>
              </div>

              {/* Field 2 */}
              <div className="p-6 border-r-1 border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Adresa stanovanja
                </p>
                <p className="text-base font-semibold text-slate-800 dark:text-white leading-snug">
                  {user.settings.homeAddress || "-"}
                </p>
              </div>

              {/* Field 3 */}
              <div className="p-6 border-r-1 border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Adresa rada
                </p>
                <p className="text-base font-semibold text-slate-800 dark:text-white leading-snug">
                  {user.settings.workAddress || "-"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic"></p>
              </div>

              {/* Field 4 */}
              <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20 ">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Udaljenost do mjesta rada
                </p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-[#135bec]">
                    {user.settings.distanceToWork?.toString() ?? "-"}
                  </p>
                  <p className="text-sm font-semibold text-slate-400 uppercase">
                    km
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          {(() => {
            //const start = { lat: 45.815, lng: 15.9819 };
            //const end = { lat: 45.808, lng: 15.967 };

            // put this state in your component scope (not inside JSX) if you prefer
            // shown inline for clarity:
            return (
              <MapWithOverlay
                start={{ lat: home.lat, lng: home.lng }}
                end={{ lat: work.lat, lng: work.lng }}
                reportedDistanceKm={reportedDistanceKm}
              />
            );
          })()}
        </section>
      </div>
      {/* Footer */}
      <footer className="mt-auto p-8 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Ivan Martinović. Sva prava pridržana.
          |{" "}
        </p>
      </footer>
    </main>
  );
}
