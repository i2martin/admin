import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing ORS_API_KEY" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const start = body?.start as { lat: number; lng: number } | undefined;
  const end = body?.end as { lat: number; lng: number } | undefined;
  const profile = (body?.profile as string) ?? "driving-car";

  if (!start || !end) {
    return NextResponse.json({ error: "start/end required" }, { status: 400 });
  }

  const coordinates: [number, number][] = [
    [start.lng, start.lat],
    [end.lng, end.lat],
  ];

  const orsUrl = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;

  const orsRes = await fetch(orsUrl, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      Accept: "*/*", // ✅ avoid 406 (GeoJSON content type)
    },
    body: JSON.stringify({
      coordinates,
      instructions: false,
    }),
  });

  // Helpful debug if anything goes wrong
  const contentType = orsRes.headers.get("content-type") ?? "";
  const rawText = await orsRes.text();

  let data: unknown;

  if (
    contentType.includes("application/json") ||
    contentType.includes("geo+json")
  ) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: { message: "Failed to parse JSON", rawText } };
    }
  } else {
    data = {
      error: {
        message: "Unexpected content-type",
        contentType,
        rawText,
      },
    };
  }

  return NextResponse.json(data);
}
