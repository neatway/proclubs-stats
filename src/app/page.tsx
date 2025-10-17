"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { safeJson } from "@/lib/utils";

/** ---------- helpers ---------- **/

type ClubHit = { clubId: string; name: string };

/** ---------- main page ---------- **/

export default function Home() {
  const router = useRouter();

  // Query & platform
  const [platform, setPlatform] = useState("common-gen5");
  const [query, setQuery] = useState(""); // club name or numeric clubId

  // Typeahead
  const [suggestions, setSuggestions] = useState<ClubHit[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchAbort = useRef<AbortController | null>(null);

  // Debug: Log whenever suggestions changes
  useEffect(() => {
    console.log('[STATE] Suggestions state changed to:', suggestions.length, 'items', suggestions);
  }, [suggestions]);

  /** ---- SEARCH: typeahead by club name ---- **/
  useEffect(() => {
    const q = query.trim();
    const isId = /^\d+$/.test(q);
    if (!q || isId || q.length < 2) {
      console.log('[SEARCH] Clearing suggestions - query too short or is ID');
      setSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      // Create new abort controller for this request
      const controller = new AbortController();
      searchAbort.current = controller;
      try {
        setLoadingSearch(true);
        console.log('[SEARCH] Starting search for:', q);

        // Call EA API directly - EA blocks server-side requests but allows browsers
        const res = await fetch(
          `https://proclubs.ea.com/api/fc/allTimeLeaderboard/search?platform=${platform}&clubName=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit',
          }
        );

        console.log('[SEARCH] Fetch completed, status:', res.status);
        console.log('[SEARCH] Response headers:', Object.fromEntries(res.headers.entries()));

        const data = await safeJson(res);
        console.log('[SEARCH] Parsed data:', data);
        console.log('[SEARCH] Data type:', typeof data, 'Is array:', Array.isArray(data));

        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.log('[SEARCH] No data or empty array - clearing suggestions');
          setSuggestions([]);
          return;
        }

        const arr = Array.isArray(data) ? data : Object.values(data ?? {});
        console.log('[SEARCH] Array length:', arr.length);

        const normalized = arr
          .map((c: unknown) => {
            const club = c as Record<string, unknown>;
            const clubInfo = club?.clubInfo as Record<string, unknown> | undefined;
            const clubObj = club?.club as Record<string, unknown> | undefined;
            return {
              clubId: String(club.clubId ?? clubInfo?.clubId ?? club.id ?? club.clubID ?? clubObj?.id ?? ""),
              name: String(club.clubName ?? clubInfo?.name ?? club.name ?? clubObj?.name ?? "Unknown"),
            };
          })
          .filter(x => x.clubId && x.name && x.name !== "Unknown");

        console.log('[SEARCH] Normalized results:', normalized);
        console.log('[SEARCH] Setting suggestions state with', normalized.length, 'items');

        if (normalized.length > 0) {
          setSuggestions(normalized);
          console.log('[SEARCH] ✅ Suggestions state set to:', normalized);
        } else {
          console.warn('[SEARCH] ⚠️ No normalized results after filtering!');
          setSuggestions([]);
        }
      } catch (e: unknown) {
        console.error('[SEARCH] Error caught:', e);
        if (e instanceof Error) {
          console.error('[SEARCH] Error name:', e.name);
          console.error('[SEARCH] Error message:', e.message);
          if (e.name !== "AbortError") {
            console.error('[SEARCH] Clearing suggestions due to error');
            setSuggestions([]);
          }
        }
      } finally {
        console.log('[SEARCH] Finally block - setting loadingSearch to false');
        setLoadingSearch(false);
      }
    }, 300);

    return () => {
      clearTimeout(t);
      // Abort ongoing request when query changes
      if (searchAbort.current) {
        console.log('[SEARCH] Aborting previous request');
        searchAbort.current.abort();
      }
    };
  }, [query, platform]);

  /** Navigate to club page **/
  function navigateToClub(clubId: string) {
    router.push(`/club/${clubId}?platform=${platform}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pro Clubs Stats Search</h1>
            <p className="text-gray-600">
              Search for clubs by name or enter a numeric club ID to view detailed stats
            </p>
          </div>

          {/* Search Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-3">
              <input
                className="border rounded-lg px-4 py-3 flex-1 min-w-[260px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a club name (e.g., Canada XI) or paste a numeric clubId"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && /^\d+$/.test(query.trim())) {
                    navigateToClub(query.trim());
                  }
                }}
              />
              <select
                className="border rounded-lg px-4 py-3"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="common-gen5">Current Gen</option>
                <option value="common-gen4">Previous Gen</option>
              </select>
            </div>
          </div>

          {/* Suggestions */}
          {!!suggestions.length && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold">Search Results</h3>
              </div>
              <ul className="divide-y">
                {suggestions.slice(0, 10).map((s) => (
                  <li
                    key={s.clubId}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => navigateToClub(s.clubId)}
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

          {/* Status */}
          {loadingSearch && (
            <div className="text-center text-gray-500 py-4">Searching clubs...</div>
          )}

          {/* Instructions */}
          {!loadingSearch && !suggestions.length && query.trim() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {/^\d+$/.test(query.trim())
                  ? "Press Enter or navigate to view this club"
                  : "Type at least 2 characters to search for clubs by name"}
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
                <p>• Search by club name for typeahead suggestions</p>
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
