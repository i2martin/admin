"use client";
import { useState } from "react";
import DashboardMap from "@/components/DashboardMap";
export function MapWithOverlay({
  start,
  end,
  reportedDistanceKm,
}: {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  reportedDistanceKm?: number;
}) {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  console.log(Number(reportedDistanceKm) !== distanceKm);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="relative h-64">
        <div className="absolute inset-0">
          <DashboardMap
            start={start}
            end={end}
            className="h-full w-full"
            profile="driving-car"
            onDistanceKm={setDistanceKm}
          />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-slate-900/80 to-transparent" />
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-[#135bec] flex items-center justify-center text-white border-2 border-white dark:border-slate-800">
                <span className="material-symbols-outlined text-sm">home</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white border-2 border-white dark:border-slate-800">
                <span className="material-symbols-outlined text-sm">
                  business
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20 ">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Izračunata ruta:
        </p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold text-[#135bec]">
            {distanceKm == null ? "—" : `${distanceKm}`}
          </p>
          <p className="text-sm font-semibold text-slate-400 uppercase">km</p>
        </div>
      </div>
      {reportedDistanceKm !== undefined &&
        distanceKm !== null &&
        reportedDistanceKm !== distanceKm && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="font-semibold mb-1">
              Napomena o razlici u udaljenosti
            </p>
            <p className="leading-relaxed">
              Prijavljena udaljenost razlikuje se od udaljenosti izračunate
              sustavom. Izračun se temelji na standardnim kartografskim podacima
              te može odstupati ovisno o korištenoj kartografskoj usluzi i
              odabranom putu. Molimo provjerite unos ako je potrebno.
            </p>
          </div>
        )}
    </div>
  );
}
