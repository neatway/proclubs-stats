import { NextRequest, NextResponse } from "next/server";
const EA_BASE = "https://proclubs.ea.com/api";


export async function GET(req: NextRequest) {
const { searchParams } = new URL(req.url);
const platform = searchParams.get("platform") ?? "common-gen5";
const clubIds = searchParams.get("clubIds");
const matchType = searchParams.get("matchType") ?? "club";
if (!clubIds) return NextResponse.json({ error: "Missing clubIds" }, { status: 400 });


const url = `${EA_BASE}/fc/clubs/matches?platform=${encodeURIComponent(platform)}&matchType=${encodeURIComponent(matchType)}&clubIds=${encodeURIComponent(clubIds)}`;
const res = await fetch(url, {
next: { revalidate: 300 },
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
});


if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });


const data = await res.json();
const resp = NextResponse.json(data);
resp.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=300");
return resp;
}