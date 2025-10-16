import { NextRequest, NextResponse } from "next/server";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const playerName = searchParams.get("name");

  if (!playerName) {
    return NextResponse.json({ error: "Missing player name" }, { status: 400 });
  }

  // Try searching for the player
  // EA might have a player search endpoint, but it's not commonly exposed
  // For now, we'll try a few possible endpoints
  const endpoints = [
    `${EA_BASE}/fc/members/search?platform=${encodeURIComponent(platform)}&name=${encodeURIComponent(playerName)}`,
    `${EA_BASE}/fc/players/search?platform=${encodeURIComponent(platform)}&name=${encodeURIComponent(playerName)}`,
    `${EA_BASE}/fc/search/members?platform=${encodeURIComponent(platform)}&name=${encodeURIComponent(playerName)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          accept: "application/json",
          origin: "https://www.ea.com",
          referer: "https://www.ea.com/",
          "user-agent": "Mozilla/5.0",
        },
        next: { revalidate: 300 },
      });

      if (!res.ok) continue;

      const text = await res.text();
      if (!text.trim()) continue;

      const data = JSON.parse(text);
      const resp = NextResponse.json({ ok: true, via: url, data });
      resp.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
      return resp;
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { error: "Player search not available. EA's API doesn't provide player search by name." },
    { status: 404 }
  );
}
