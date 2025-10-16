import { NextRequest, NextResponse } from "next/server";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const clubIds = searchParams.get("clubIds");

  if (!clubIds) {
    return NextResponse.json({ error: "Missing clubIds" }, { status: 400 });
  }

  const url = `${EA_BASE}/fc/clubs/overallStats?platform=${encodeURIComponent(platform)}&clubIds=${encodeURIComponent(clubIds)}`;

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

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || res.statusText }, { status: res.status });
    }

    const text = await res.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "Empty response from EA" }, { status: 502 });
    }

    const data = JSON.parse(text);
    const resp = NextResponse.json(data);
    resp.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
    return resp;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
