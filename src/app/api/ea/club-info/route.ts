import { NextRequest, NextResponse } from "next/server";
import { fetchEA } from "@/lib/ea-server-proxy";

const EA_BASE = "https://proclubs.ea.com/api";

// Cache this route for 5 minutes (300 seconds)
export const revalidate = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const clubIds = searchParams.get("clubIds");
  if (!clubIds) return NextResponse.json({ error: "Missing clubIds" }, { status: 400 });

  const url = `${EA_BASE}/fc/clubs/info?platform=${encodeURIComponent(platform)}&clubIds=${encodeURIComponent(clubIds)}`;

  const res = await fetchEA(url);

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });

  const data = await res.json();
  return NextResponse.json(data);
}
