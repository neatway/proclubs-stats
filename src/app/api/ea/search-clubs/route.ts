import { NextRequest, NextResponse } from "next/server";

const EA_BASE = "https://proclubs.ea.com/api";

// Use Edge Runtime (different IPs, might bypass EA's blocking)
export const runtime = 'edge';

// Cache this route for 2 minutes (120 seconds)
export const revalidate = 120;

export async function GET(req: NextRequest) {
  // Note: Rate limiting removed for Edge runtime (use Vercel's built-in rate limiting instead)

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
    console.log('[EA API Search] Fetching:', url);

    // Call EA API directly from server-side with full browser headers
    const res = await fetch(url, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "referer": "https://www.ea.com/",
        "origin": "https://www.ea.com",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    console.log('[EA API Search] Response status:', res.status);
    console.log('[EA API Search] Content-Type:', res.headers.get('content-type'));

    // EA sometimes returns HTML error pages instead of JSON
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.error('[EA API Search] Received HTML instead of JSON (EA is blocking the request)');
      const text = await res.text();
      console.error('[EA API Search] Response preview:', text.substring(0, 200));
      return NextResponse.json([]);
    }

    // Handle non-200 responses
    if (!res.ok) {
      console.error('[EA API Search] Non-OK response:', res.status, res.statusText);
      return NextResponse.json([]);
    }

    // Parse JSON response
    let data;
    try {
      const text = await res.text();
      console.log('[EA API Search] Raw response length:', text.length);
      console.log('[EA API Search] Raw response preview:', text.substring(0, 200));
      data = text ? JSON.parse(text) : [];
      console.log('[EA API Search] Successfully parsed JSON');
    } catch (jsonError) {
      console.error('[EA API Search] Failed to parse JSON:', jsonError);
      return NextResponse.json([]);
    }

    // Normalize data to array format
    let list: any[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && typeof data === "object") {
      list = Object.values(data);
    }

    console.log('[EA API Search] Processing', list.length, 'items');

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

    console.log('[EA API Search] Returning', clubs.length, 'clubs');

    const resp = NextResponse.json(clubs);
    resp.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=120");
    return resp;

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[EA API Search] Catch block error:', message);
    console.error('[EA API Search] Full error:', e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
