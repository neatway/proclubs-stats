export const runtime = 'edge';

import { redirect } from "next/navigation";

const EA_BASE = "https://ancient-grass-8d5f.jessevella13.workers.dev";

type ClubHit = { clubId: string; name: string };

async function searchClubs(
  query: string,
  platform: string
): Promise<ClubHit[]> {
  if (!query || query.length < 2) return [];

  const url = `${EA_BASE}/fc/allTimeLeaderboard/search?platform=${encodeURIComponent(
    platform
  )}&clubName=${encodeURIComponent(query)}`;

  try {
    console.log(`[Server Search] Fetching: ${url}`);

    // Call Cloudflare Worker proxy (worker adds headers and calls EA)
    const res = await fetch(url, {
      cache: "no-store",
    });

    console.log(`[Server Search] Response status: ${res.status}`);
    console.log(`[Server Search] Content-Type: ${res.headers.get('content-type')}`);

    // EA sometimes returns HTML error pages instead of JSON
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.error(`[Server Search] Received HTML instead of JSON (EA is blocking)`);
      const text = await res.text();
      console.error(`[Server Search] Response preview: ${text.substring(0, 200)}`);
      return [];
    }

    if (!res.ok) {
      console.error(`[Server Search] Non-OK response: ${res.status} ${res.statusText}`);
      return [];
    }

    let data;
    try {
      data = await res.json();
      console.log(`[Server Search] Successfully parsed JSON`);
    } catch (jsonError) {
      console.error(`[Server Search] Failed to parse JSON:`, jsonError);
      return [];
    }

    // Normalize result to array
    let list: unknown[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && typeof data === "object") {
      list = Object.values(data as Record<string, unknown>);
    }

    const clubs = list
      .map((c: unknown) => {
        const club = c as Record<string, unknown>;
        const clubInfo = club?.clubInfo as Record<string, unknown> | undefined;
        const clubObj = club?.club as Record<string, unknown> | undefined;
        return {
          clubId: String(
            club.clubId ??
              clubInfo?.clubId ??
              club.id ??
              club.clubID ??
              clubObj?.id ??
              ""
          ),
          name: String(
            club.clubName ??
              clubInfo?.name ??
              club.name ??
              clubObj?.name ??
              "Unknown"
          ),
        };
      })
      .filter((x) => x.clubId && x.name && x.name !== "Unknown");

    console.log(`[Server Search] Returning ${clubs.length} clubs`);
    return clubs;
  } catch (e) {
    console.error("[Server Search] Error:", e);
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = (params.q as string) || "";
  const platform = (params.platform as string) || "common-gen5";

  // If query is a numeric clubId, redirect to club page
  if (query && /^\d+$/.test(query.trim())) {
    redirect(`/club/${query.trim()}?platform=${platform}`);
  }

  // Server-side search
  const suggestions = query.trim().length >= 2 ? await searchClubs(query, platform) : [];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pro Clubs Stats Search</h1>
          <p className="text-gray-600">
            Search for clubs by name or enter a numeric club ID to view detailed stats
          </p>
        </div>

        {/* Search Form - Server-side submission */}
        <form method="get" action="/" className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-3">
            <input
              name="q"
              className="border rounded-lg px-4 py-3 flex-1 min-w-[260px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a club name (e.g., Canada XI) or paste a numeric clubId"
              defaultValue={query}
              autoComplete="off"
            />
            <select
              name="platform"
              className="border rounded-lg px-4 py-3"
              defaultValue={platform}
            >
              <option value="common-gen5">Current Gen</option>
              <option value="common-gen4">Previous Gen</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Search Results */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold">
                {suggestions.length} {suggestions.length === 1 ? "club" : "clubs"} found
              </h3>
            </div>
            <ul className="divide-y">
              {suggestions.slice(0, 10).map((s) => (
                <li key={s.clubId}>
                  <a
                    href={`/club/${s.clubId}?platform=${platform}`}
                    className="block p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-lg">{s.name}</div>
                        <div className="text-sm text-gray-500">Club ID: {s.clubId}</div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No results message */}
        {query.trim().length >= 2 && suggestions.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              No clubs found matching &quot;{query}&quot;. Try a different search term.
            </p>
          </div>
        )}

        {/* Welcome message */}
        {!query.trim() && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold mb-3">Welcome to Pro Clubs Stats</h2>
            <p className="text-gray-600 mb-4">
              Search for any EA Sports FC Pro Clubs team to view detailed statistics, member
              rosters, and match history.
            </p>
            <div className="text-sm text-gray-500 space-y-2">
              <p>• Search by club name for suggestions</p>
              <p>• Enter a numeric Club ID directly to view that club</p>
              <p>• Click on player names to view individual career stats</p>
              <p>• Click on opponent names in match history to view their clubs</p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Unofficial fan project. Data via EA Pro Clubs web API. Some endpoints may return
          empty bodies; results are cached briefly.
        </p>
      </div>
    </main>
  );
}
