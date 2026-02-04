import { NextRequest, NextResponse } from "next/server";
import { fetchEA } from "@/lib/ea-server-proxy";

/**
 * Generic EA API proxy route.
 * Client-side code calls this with ?url=<EA_API_URL> and we proxy
 * through the Cloudflare Worker server-side.
 *
 * This keeps the proxy URL as a server secret and avoids CORS issues.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow EA API requests
  if (!targetUrl.startsWith("https://proclubs.ea.com/api/")) {
    return NextResponse.json({ error: "Only EA API requests allowed" }, { status: 403 });
  }

  try {
    const res = await fetchEA(targetUrl, { timeout: 15000, revalidate: 120 });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || res.statusText },
        { status: res.status }
      );
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    const resp = NextResponse.json(data);
    resp.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=120");
    return resp;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[EA Proxy Route] Error:", message);
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}
