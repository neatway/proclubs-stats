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
    console.log('[EA API] Fetching:', url);
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        referer: "https://www.ea.com/",
        "user-agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    console.log('[EA API] Response status:', res.status);

    // If EA blocks the request with HTML error page, return empty results
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.error('[EA API] Received HTML instead of JSON - EA is blocking requests');
      return NextResponse.json([]);
    }

    // EA API sometimes returns 403 but with valid JSON data - parse it anyway
    let data;
    try {
      data = await res.json();
      console.log('[EA API] Parsed data:', JSON.stringify(data).substring(0, 500));
    } catch (jsonError) {
      // If JSON parsing fails, return empty array
      console.error('[EA API] Failed to parse response:', jsonError);
      return NextResponse.json([]);
    }

    // Normalize result to a simple array [{ clubId, name }]
    // (Adjust fields if the shape differs on your machine)
    let list: unknown[] = [];
    if (Array.isArray(data)) list = data;
    else if (data && typeof data === "object") list = Object.values(data as Record<string, unknown>);

    console.log('[EA API] List length:', list.length);
    if (list.length > 0) {
      console.log('[EA API] First item:', JSON.stringify(list[0]));
    }

    const clubs = list
      .map((c: unknown) => {
        const club = c as Record<string, unknown>;
        const clubInfo = club?.clubInfo as Record<string, unknown> | undefined;
        const clubObj = club?.club as Record<string, unknown> | undefined;
        return {
          clubId: String(club.clubId ?? clubInfo?.clubId ?? club.id ?? club.clubID ?? clubObj?.id ?? ""),
          name: String(club.clubName ?? clubInfo?.name ?? club.name ?? clubObj?.name ?? "Unknown"),
        };
      })
      .filter((x) => x.clubId && x.name && x.name !== "Unknown");

    console.log('[EA API] Normalized clubs:', clubs.length);

    const resp = NextResponse.json(clubs);
    resp.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=120");
    return resp;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
