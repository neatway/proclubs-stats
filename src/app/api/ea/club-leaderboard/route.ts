import { NextRequest, NextResponse } from "next/server";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const clubName = searchParams.get("clubName");

  if (!clubName) {
    return NextResponse.json({ error: "Missing clubName" }, { status: 400 });
  }

  const url = `${EA_BASE}/fc/allTimeLeaderboard/search?platform=${encodeURIComponent(
    platform
  )}&clubName=${encodeURIComponent(clubName)}`;

  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        origin: "https://www.ea.com",
        referer: "https://www.ea.com/",
        "user-agent": "Mozilla/5.0",
      },
      next: { revalidate: 300 }, // 5 min cache for leaderboard data
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || res.statusText }, { status: res.status });
    }

    const data = await res.json();

    // Return the raw data which should include currentDivision, bestDivision, skillRating
    const resp = NextResponse.json(data);
    resp.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
    return resp;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
