import { NextRequest, NextResponse } from "next/server";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const url = `${EA_BASE}/fc/allTimeLeaderboard/search?platform=${encodeURIComponent(
    platform
  )}&clubName=${encodeURIComponent(q)}`;

  try {
    console.log('[EA API] Fetching:', url);

    // Call EA directly with proper browser headers (NO PROXY)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.ea.com/',
        'Origin': 'https://www.ea.com',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      cache: "no-store",
    });

    console.log('[EA API] Response status:', res.status);
    console.log('[EA API] Content-Type:', res.headers.get('content-type'));

    // EA sometimes returns HTML error pages instead of JSON
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.error('[EA API] Received HTML instead of JSON (EA is blocking the request)');
      const text = await res.text();
      console.error('[EA API] Response preview:', text.substring(0, 200));
      return NextResponse.json([]);
    }

    // Handle non-200 responses
    if (!res.ok) {
      console.error('[EA API] Non-OK response:', res.status, res.statusText);
      return NextResponse.json([]);
    }

    // Parse JSON response
    let data;
    try {
      data = await res.json();
      console.log('[EA API] Successfully parsed JSON');
    } catch (jsonError) {
      console.error('[EA API] Failed to parse JSON:', jsonError);
      return NextResponse.json([]);
    }

    // Normalize data to array format
    let list: any[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && typeof data === "object") {
      list = Object.values(data);
    }

    console.log('[EA API] Processing', list.length, 'items');

    // Map to consistent format
    const clubs = list
      .map((c: any) => {
        const clubInfo = c?.clubInfo;
        return {
          clubId: String(c.clubId ?? clubInfo?.clubId ?? c.id ?? ""),
          name: String(c.clubName ?? clubInfo?.name ?? c.name ?? "Unknown"),
          platform: platform,
        };
      })
      .filter((x) => x.clubId && x.name !== "Unknown");

    console.log('[EA API] Returning', clubs.length, 'clubs');

    const resp = NextResponse.json(clubs);
    resp.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=120");
    return resp;

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[EA API] Catch block error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
