import { NextRequest, NextResponse } from "next/server";
import { fetchEA } from "@/lib/ea-server-proxy";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const clubIds = searchParams.get("clubIds");
  const matchType = searchParams.get("matchType") ?? "club";
  if (!clubIds) return NextResponse.json({ error: "Missing clubIds" }, { status: 400 });

  const url = `${EA_BASE}/fc/clubs/matches?platform=${encodeURIComponent(platform)}&matchType=${encodeURIComponent(matchType)}&clubIds=${encodeURIComponent(clubIds)}`;

  const res = await fetchEA(url, { timeout: 15000 });

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });

  const data = await res.json();
  const resp = NextResponse.json(data);
  resp.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
  return resp;
}
