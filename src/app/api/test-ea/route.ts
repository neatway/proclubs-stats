export const runtime = 'edge';

import { NextResponse } from "next/server";

// Test endpoint to see what EA actually returns
export async function GET() {
  const url = "https://proclubs.ea.com/api/fc/allTimeLeaderboard/search?platform=common-gen5&clubName=canada%20xi";

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.ea.com/',
        'Origin': 'https://www.ea.com',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      contentType,
      headers: Object.fromEntries(res.headers.entries()),
      bodyPreview: text.substring(0, 1000),
      bodyLength: text.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
