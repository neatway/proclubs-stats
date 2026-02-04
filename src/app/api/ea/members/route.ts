import { NextRequest, NextResponse } from "next/server";
import { fetchEA } from "@/lib/ea-server-proxy";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const clubId = searchParams.get("clubId");
  const scope = searchParams.get("scope") ?? "club";

  if (!clubId) return NextResponse.json({ error: "Missing clubId" }, { status: 400 });

  const endpoint = scope === "career"
    ? `${EA_BASE}/fc/members/career/stats`
    : `${EA_BASE}/fc/members/stats`;

  const url = `${endpoint}?platform=${encodeURIComponent(platform)}&clubId=${encodeURIComponent(clubId)}`;

  const res = await fetchEA(url);

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text || res.statusText }, { status: res.status });
  }

  const data = await res.json();
  const resp = NextResponse.json(data);
  resp.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
  return resp;
}
