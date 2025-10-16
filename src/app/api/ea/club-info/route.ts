import { NextRequest, NextResponse } from "next/server";

const EA_BASE = "https://proclubs.ea.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? "common-gen5";
  const clubIds = searchParams.get("clubIds");
  if (!clubIds) return NextResponse.json({ error: "Missing clubIds" }, { status: 400 });

  const url = `${EA_BASE}/fc/clubs/info?platform=${encodeURIComponent(platform)}&clubIds=${encodeURIComponent(clubIds)}`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      origin: "https://www.ea.com",
      referer: "https://www.ea.com/",
      "user-agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });

  const data = await res.json();
  return NextResponse.json(data);
}
