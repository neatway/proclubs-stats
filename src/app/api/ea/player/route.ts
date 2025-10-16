import { NextRequest, NextResponse } from "next/server";
const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const personaId = searchParams.get("personaId");
  if (!personaId) return NextResponse.json({ error: "Missing personaId" }, { status: 400 });

  // Try a few likely endpoints (EA changes these per title)
  const candidates = [
    `${EA_BASE}/fc/members/career/stats?platform=${encodeURIComponent(platform)}&personaId=${encodeURIComponent(personaId)}`,
    `${EA_BASE}/fc/members/stats?platform=${encodeURIComponent(platform)}&personaId=${encodeURIComponent(personaId)}`,
    `${EA_BASE}/fc/members?platform=${encodeURIComponent(platform)}&personaId=${encodeURIComponent(personaId)}`
  ];

  for (const url of candidates) {
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
      // try next candidate
    }
  }
  return NextResponse.json(
    { error: "No player endpoint worked. Open EA site DevTools and copy the persona stats URL for this title." },
    { status: 502 }
  );
}
