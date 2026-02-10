import { NextResponse } from "next/server";

type OrsGeocodeFeature = {
  properties: { label?: string };
  geometry: { coordinates: [number, number] }; // [lng, lat]
};

type OrsGeocodeResponse = {
  features?: OrsGeocodeFeature[];
  error?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export async function GET(req: Request) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing ORS_API_KEY" }, { status: 500 });
  }

  const url = new URL(req.url);
  const text = (url.searchParams.get("text") ?? "").trim();

  if (!text) {
    return NextResponse.json({ features: [] });
  }

  // ORS Geocoding (Pelias)
  const orsUrl = new URL("https://api.openrouteservice.org/geocode/search");
  orsUrl.searchParams.set("api_key", apiKey);
  orsUrl.searchParams.set("text", text);
  orsUrl.searchParams.set("size", "5");
  // Optional: bias results to Croatia (HR)
  orsUrl.searchParams.set("boundary.country", "HR");

  const orsRes = await fetch(orsUrl.toString(), {
    headers: {
      Accept: "*/*",
    },
    cache: "no-store",
  });

  const contentType = orsRes.headers.get("content-type") ?? "";
  const rawText = await orsRes.text();

  let data: unknown;
  if (contentType.includes("json")) {
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: { message: "Failed to parse ORS geocode JSON" }, rawText },
        { status: 502 },
      );
    }
  } else {
    return NextResponse.json(
      { error: { message: "Unexpected content-type", contentType }, rawText },
      { status: 502 },
    );
  }

  // Normalize ORS errors (sometimes can be 200 + error)
  if (!orsRes.ok || (isRecord(data) && "error" in data)) {
    return NextResponse.json(
      {
        error: isRecord(data)
          ? ((data as OrsGeocodeResponse).error ?? data)
          : data,
      },
      { status: orsRes.ok ? 400 : orsRes.status },
    );
  }

  return NextResponse.json(data as OrsGeocodeResponse);
}
