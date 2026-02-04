/**
 * Server-side EA API Proxy Helper
 *
 * Routes EA API requests through a Cloudflare Worker to bypass
 * EA's IP blocking of Vercel serverless functions.
 *
 * Uses EA_PROXY_URL (server-only, not exposed to client bundle).
 * Falls back to direct fetch if no proxy is configured.
 */

const EA_PROXY_URL = process.env.EA_PROXY_URL;

const EA_HEADERS: Record<string, string> = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  "referer": "https://www.ea.com/",
  "origin": "https://www.ea.com",
  "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

export interface FetchEAOptions {
  timeout?: number;
  revalidate?: number;
}

/**
 * Fetch from EA API, routing through Cloudflare Worker proxy if configured.
 * Returns the raw Response object.
 */
export async function fetchEA(
  eaUrl: string,
  options: FetchEAOptions = {}
): Promise<Response> {
  const { timeout = 15000, revalidate = 300 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    if (EA_PROXY_URL) {
      // Route through Cloudflare Worker
      const proxyUrl = `${EA_PROXY_URL}?url=${encodeURIComponent(eaUrl)}`;
      console.log(`[EA Server] Proxying via Cloudflare Worker: ${eaUrl}`);

      const res = await fetch(proxyUrl, {
        signal: controller.signal,
        next: { revalidate },
      } as RequestInit);

      return res;
    }

    // Fallback: direct fetch with browser headers (works locally, may 403 on Vercel)
    console.log(`[EA Server] Direct fetch (no proxy configured): ${eaUrl}`);

    const res = await fetch(eaUrl, {
      headers: EA_HEADERS,
      signal: controller.signal,
      next: { revalidate },
    } as RequestInit);

    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch from EA API and parse JSON response.
 * Returns parsed data or null for empty responses.
 */
export async function fetchEAJson(
  eaUrl: string,
  options: FetchEAOptions = {}
): Promise<any> {
  const res = await fetchEA(eaUrl, options);

  if (!res.ok) {
    throw new Error(`EA API returned ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();
  if (!text.trim()) return null;

  return JSON.parse(text);
}
