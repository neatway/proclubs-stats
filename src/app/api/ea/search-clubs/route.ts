import { NextRequest, NextResponse } from "next/server";
import { fetchEA } from "@/lib/ea-server-proxy";

const EA_BASE = "https://proclubs.ea.com/api";

// Cache this route for 2 minutes (120 seconds)
export const revalidate = 120;

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
    const res = await fetchEA(url, { revalidate: 120, timeout: 10000 });

    // EA sometimes returns HTML error pages instead of JSON
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.error('[EA API Search] Received HTML instead of JSON (EA is blocking)');
      return NextResponse.json([]);
    }

    if (!res.ok) {
      console.error('[EA API Search] Non-OK response:', res.status, res.statusText);
      return NextResponse.json([]);
    }

    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : [];
    } catch {
      console.error('[EA API Search] Failed to parse JSON');
      return NextResponse.json([]);
    }

    // Normalize data to array format
    let list: any[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && typeof data === "object") {
      list = Object.values(data);
    }

    const clubs = list
      .map((c: any) => {
        const clubInfo = c?.clubInfo;
        return {
          clubId: String(c.clubId ?? clubInfo?.clubId ?? c.id ?? ""),
          name: String(c.clubName ?? clubInfo?.name ?? c.name ?? "Unknown"),
          platform,
        };
      })
      .filter((x) => x.clubId && x.name !== "Unknown");

    const resp = NextResponse.json(clubs);
    resp.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=120");
    return resp;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[EA API Search] Error:', message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
