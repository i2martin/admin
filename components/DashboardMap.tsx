"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false },
);

type LatLng = { lat: number; lng: number };

function FixLeafletIcons() {
  useEffect(() => {
    import("leaflet").then((L) => {
      // @ts-expect-error private Leaflet internals
      delete L.Icon.Default.prototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FitBounds({
  points,
  route,
}: {
  points: LatLng[];
  route: [number, number][]; // [lat,lng]
}) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    // Dynamic import to avoid server/window issues
    import("leaflet").then((L) => {
      const latLngs: [number, number][] = [
        ...points.map((p) => [p.lat, p.lng] as [number, number]),
        ...route,
      ];

      if (!latLngs.length) return;
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [30, 30] });
    });
  }, [map, points, route]);

  return null;
}

export default function DashboardMap({
  start,
  end,
  className = "h-full w-full",
  profile = "driving-car",
  onDistanceKm,
}: {
  start: LatLng;
  end: LatLng;
  className?: string;
  profile?: "driving-car" | "cycling-regular" | "foot-walking";
  onDistanceKm?: (km: number | null) => void;
}) {
  const [routeLatLngs, setRouteLatLngs] = useState<[number, number][]>([]);
  const points = useMemo(() => [start, end], [start, end]);

  useEffect(() => {
    async function run() {
      setRouteLatLngs([]);
      onDistanceKm?.(null);

      const r = await fetch("/api/ors/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, end, profile }),
      });

      const data = await r.json();
      console.log("ORS keys:", Object.keys(data));
      console.log("features?", data?.features?.length);
      console.log("summary:", data?.features?.[0]?.properties?.summary);
      if (!r.ok || data?.error) {
        console.error("Directions failed:", data?.error ?? data);
        return;
      }

      // ORS GeoJSON returns coordinates as [lng, lat][]
      const coords: [number, number][] =
        data.features?.[0]?.geometry?.coordinates ?? [];
      const latLngs: [number, number][] = coords.map(([lng, lat]) => [
        lat,
        lng,
      ]);
      setRouteLatLngs(latLngs);

      const meters = data.features?.[0]?.properties?.summary?.distance;
      if (typeof meters === "number") {
        const km = Math.round((meters / 1000) * 10) / 10; // 1 decimal
        onDistanceKm?.(km);
        console.log(`Distance: ${km} km`);
      }
    }

    run();
  }, [start.lat, start.lng, end.lat, end.lng, profile, onDistanceKm]);

  return (
    <div className={className}>
      <MapContainer
        center={[start.lat, start.lng]}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
      >
        <FixLeafletIcons />
        <InvalidateSize />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[start.lat, start.lng]} />
        <Marker position={[end.lat, end.lng]} />

        {routeLatLngs.length > 0 && <Polyline positions={routeLatLngs} />}

        <FitBounds points={points} route={routeLatLngs} />
      </MapContainer>

      {/* Optional: if you ever want distance overlay INSIDE map component */}
      {/* <div className="absolute top-2 left-2 bg-white/90 p-2 rounded">Distance: {distanceKm ?? "—"} km</div> */}
    </div>
  );
}
