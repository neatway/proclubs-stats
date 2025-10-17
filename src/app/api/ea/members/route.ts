import { NextRequest, NextResponse } from "next/server";
const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const clubId = searchParams.get("clubId");
  const scope = searchParams.get("scope") ?? "club";

  if (!clubId) return NextResponse.json({ error: "Missing clubId" }, { status: 400 });

  // Use club-specific stats endpoint for "club" scope, career stats for "career" scope
  const endpoint = scope === "career"
    ? `${EA_BASE}/fc/members/career/stats`
    : `${EA_BASE}/fc/members/stats`;

  const url = `${endpoint}?platform=${encodeURIComponent(platform)}&clubId=${encodeURIComponent(clubId)}`;

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
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text || res.statusText }, { status: res.status });
  }

  const data = await res.json();
  const resp = NextResponse.json(data);
  resp.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
  return resp;
}
