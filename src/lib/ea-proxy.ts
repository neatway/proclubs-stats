/**
 * EA API Proxy Helper
 *
 * EA blocks Vercel's IPs with 403 Forbidden.
 * This helper uses CORS proxies to fetch EA data from the client side.
 */

// Multiple CORS proxies with fallback support
const CORS_PROXIES = [
  { name: "codetabs", url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}` },
  { name: "allorigins", url: (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}` },
  { name: "corsproxy-io", url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}` },
];

export interface EAProxyOptions {
  timeout?: number;
  cache?: RequestCache;
}

/**
 * Fetch from EA API via CORS proxy with fallback
 */
export async function fetchEAWithProxy(
  url: string,
  options: EAProxyOptions = {}
): Promise<any> {
  const { timeout = 20000, cache = "default" } = options;

  let lastError: Error | null = null;

  // Try each proxy in sequence
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy.url(url);
      console.log(`[EA Proxy] Trying ${proxy.name}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(proxyUrl, {
        signal: controller.signal,
        cache,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[EA Proxy] ${proxy.name} returned ${res.status}`);
        lastError = new Error(`${proxy.name} returned ${res.status}`);
        continue;
      }

      const text = await res.text();
      console.log(`[EA Proxy] Success with ${proxy.name}`);
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn(`[EA Proxy] ${proxy.name} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  // All proxies failed
  console.error("EA Proxy: All proxies failed", lastError);
  throw lastError || new Error("All CORS proxies failed");
}

/**
 * Search for clubs by name
 */
export async function searchClubs(
  query: string,
  platform: string = "common-gen5"
): Promise<Array<{ clubId: string; name: string }>> {
  const url = `https://proclubs.ea.com/api/fc/allTimeLeaderboard/search?platform=${encodeURIComponent(
    platform
  )}&clubName=${encodeURIComponent(query)}`;

  const data = await fetchEAWithProxy(url, { timeout: 8000 });

  // Normalize response to array
  let list: any[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object") {
    list = Object.values(data);
  }

  // Map to consistent format
  return list
    .map((c: any) => {
      const clubInfo = c?.clubInfo;
      return {
        clubId: String(c.clubId ?? clubInfo?.clubId ?? c.id ?? ""),
        name: String(c.clubName ?? clubInfo?.name ?? c.name ?? "Unknown"),
      };
    })
    .filter((x) => x.clubId && x.name !== "Unknown");
}

/**
 * Get club info
 */
export async function getClubInfo(
  clubIds: string | string[],
  platform: string = "common-gen5"
): Promise<any> {
  const ids = Array.isArray(clubIds) ? clubIds.join(",") : clubIds;
  const url = `https://proclubs.ea.com/api/fc/clubs/info?platform=${platform}&clubIds=${ids}`;

  return fetchEAWithProxy(url);
}

/**
 * Get club members
 */
export async function getClubMembers(
  clubId: string,
  platform: string = "common-gen5",
  scope: "club" | "career" = "career"
): Promise<any> {
  const url = `https://proclubs.ea.com/api/fc/members/${scope}/stats?platform=${platform}&clubId=${clubId}`;

  return fetchEAWithProxy(url);
}

/**
 * Get club matches
 */
export async function getClubMatches(
  clubIds: string | string[],
  matchType: string,
  platform: string = "common-gen5"
): Promise<any> {
  const ids = Array.isArray(clubIds) ? clubIds.join(",") : clubIds;
  const url = `https://proclubs.ea.com/api/fc/clubs/matches?platform=${platform}&clubIds=${ids}&matchType=${matchType}`;

  return fetchEAWithProxy(url, { timeout: 15000 });
}
