"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type ClubHit = { clubId: string; name: string };

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("common-gen5");
  const [suggestions, setSuggestions] = useState<ClubHit[]>([]);
  const [loading, setLoading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  // Client-side search with debounce
  useEffect(() => {
    const trimmedQuery = query.trim();

    // If numeric ID, don't search
    if (/^\d+$/.test(trimmedQuery)) {
      setSuggestions([]);
      return;
    }

    // Need at least 2 characters
    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      // Abort previous request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      setLoading(true);

      try {
        // Fetch directly from EA API (client-side)
        const url = `https://proclubs.ea.com/api/fc/allTimeLeaderboard/search?platform=${encodeURIComponent(
          platform
        )}&clubName=${encodeURIComponent(trimmedQuery)}`;

        console.log('[Client Search] Fetching:', url);

        const res = await fetch(url, {
          signal: abortController.current.signal,
        });

        if (!res.ok) {
          console.error('[Client Search] Failed:', res.status);
          setSuggestions([]);
          return;
        }

        const data = await res.json();
        console.log('[Client Search] Got data:', data);

        // Normalize to array
        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && typeof data === "object") {
          list = Object.values(data);
        }

        // Map to ClubHit format
        const clubs = list
          .map((c: any) => {
            const clubInfo = c?.clubInfo;
            return {
              clubId: String(c.clubId ?? clubInfo?.clubId ?? c.id ?? ""),
              name: String(c.clubName ?? clubInfo?.name ?? c.name ?? "Unknown"),
            };
          })
          .filter((x) => x.clubId && x.name !== "Unknown");

        console.log('[Client Search] Returning', clubs.length, 'clubs');
        setSuggestions(clubs);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('[Client Search] Error:', e);
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timer);
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [query, platform]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();

    // If numeric ID, navigate to club page
    if (/^\d+$/.test(trimmedQuery)) {
      router.push(`/club/${trimmedQuery}?platform=${platform}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pro Clubs Stats Search</h1>
          <p className="text-gray-600">
            Search for clubs by name or enter a numeric club ID to view detailed stats
          </p>
        </div>

        {/* Search Form - Client-side */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-3">
            <input
              className="border rounded-lg px-4 py-3 flex-1 min-w-[260px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a club name (e.g., Canada XI) or paste a numeric clubId"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <select
              className="border rounded-lg px-4 py-3"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
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
                <li
                  key={s.clubId}
                  onClick={() => router.push(`/club/${s.clubId}?platform=${platform}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition"
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
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center text-gray-500 py-4">Searching clubs...</div>
        )}

        {/* No results message */}
        {!loading && query.trim().length >= 2 && suggestions.length === 0 && (
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
