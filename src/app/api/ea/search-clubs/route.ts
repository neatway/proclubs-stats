import { NextRequest, NextResponse } from "next/server";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const q = searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  // Use the endpoint you found in DevTools:
  const url = `${EA_BASE}/fc/allTimeLeaderboard/search?platform=${encodeURIComponent(
    platform
  )}&clubName=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        origin: "https://www.ea.com",
        referer: "https://www.ea.com/",
        "user-agent": "Mozilla/5.0",
      },
      next: { revalidate: 120 }, // short edge cache while typing
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || res.statusText }, { status: res.status });
    }

    const data = await res.json();

    // Normalize result to a simple array [{ clubId, name }]
    // (Adjust fields if the shape differs on your machine)
    let list: unknown[] = [];
    if (Array.isArray(data)) list = data;
    else if (data && typeof data === "object") list = Object.values(data as Record<string, unknown>);

    const clubs = list
      .map((c: unknown) => {
        const club = c as Record<string, unknown>;
        const clubObj = club?.club as Record<string, unknown> | undefined;
        return {
          clubId: String(club.clubId ?? club.id ?? club.clubID ?? clubObj?.id ?? ""),
          name: String(club.name ?? club.clubName ?? clubObj?.name ?? "Unknown"),
        };
      })
      .filter((x) => x.clubId && x.name);

    const resp = NextResponse.json(clubs);
    resp.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=120");
    return resp;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
