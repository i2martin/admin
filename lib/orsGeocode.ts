// lib/orsGeocode.ts
export type LatLng = { lat: number; lng: number; label?: string | null };

type OrsGeocodeFeature = {
  properties?: { label?: string };
  geometry?: { coordinates?: [number, number] }; // [lng, lat]
};

type OrsGeocodeResponse = {
  features?: OrsGeocodeFeature[];
  error?: unknown;
};

export async function orsGeocodeOne(text: string): Promise<LatLng | null> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) throw new Error("Missing ORS_API_KEY in .env.local");

  const q = text.trim();
  if (!q) return null;

  const url = new URL("https://api.openrouteservice.org/geocode/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("text", q);
  url.searchParams.set("size", "1");
  // optional: bias results to Croatia (HR)
  url.searchParams.set("boundary.country", "HR");

  const res = await fetch(url.toString(), {
    headers: { Accept: "*/*" },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const rawText = await res.text();

  let data: OrsGeocodeResponse | null = null;
  if (contentType.includes("json")) {
    try {
      data = JSON.parse(rawText) as OrsGeocodeResponse;
    } catch {
      throw new Error("Failed to parse ORS geocode JSON");
    }
  } else {
    throw new Error(`Unexpected ORS geocode content-type: ${contentType}`);
  }

  // ORS can return 200 + error payload too
  if (!res.ok || data?.error) {
    throw new Error(
      `ORS geocode failed: ${typeof data?.error === "string" ? data.error : "unknown error"}`,
    );
  }

  const feature = data.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!coords) return null;

  const [lng, lat] = coords;
  return {
    lat,
    lng,
    label: feature?.properties?.label ?? null,
  };
}
