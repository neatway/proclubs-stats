import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const EA_BASE = "https://proclubs.ea.com/api";

// Cache this route for 2 minutes (120 seconds)
export const revalidate = 120;

const isDev = process.env.NODE_ENV === "development";

export async function GET(req: NextRequest) {
  // Rate limiting: 30 requests per minute
  const ip = getClientIp(req);
  const rateLimitResult = rateLimit(ip, { limit: 30, window: 60 });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

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
    if (isDev) console.log('[EA API] Fetching:', url);

    // Call EA API directly from server-side with full browser headers
    const res = await fetch(url, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "referer": "https://www.ea.com/",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (isDev) {
      console.log('[EA API] Response status:', res.status);
      console.log('[EA API] Content-Type:', res.headers.get('content-type'));
    }

    // EA sometimes returns HTML error pages instead of JSON
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      if (isDev) {
        console.error('[EA API] Received HTML instead of JSON (EA is blocking the request)');
        const text = await res.text();
        console.error('[EA API] Response preview:', text.substring(0, 200));
      }
      return NextResponse.json([]);
    }

    // Handle non-200 responses
    if (!res.ok) {
      if (isDev) console.error('[EA API] Non-OK response:', res.status, res.statusText);
      return NextResponse.json([]);
    }

    // Parse JSON response
    let data;
    try {
      data = await res.json();
      if (isDev) console.log('[EA API] Successfully parsed JSON');
    } catch (jsonError) {
      if (isDev) console.error('[EA API] Failed to parse JSON:', jsonError);
      return NextResponse.json([]);
    }

    // Normalize data to array format
    let list: any[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && typeof data === "object") {
      list = Object.values(data);
    }

    if (isDev) console.log('[EA API] Processing', list.length, 'items');

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

    if (isDev) console.log('[EA API] Returning', clubs.length, 'clubs');

    const resp = NextResponse.json(clubs);
    resp.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=120");
    return resp;

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (isDev) console.error('[EA API] Catch block error:', message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
