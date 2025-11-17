"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type ClubHit = { clubId: string; name: string };

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const platform = searchParams.get("platform") || "common-gen5";

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<ClubHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is a numeric clubId, don't search
    if (query && /^\d+$/.test(query.trim())) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Search for clubs if query is at least 2 characters
    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          // EA blocks both Vercel (403) and CORS from browsers
          // Use CORS proxy to bypass restrictions
          const eaUrl = `https://proclubs.ea.com/api/fc/allTimeLeaderboard/search?platform=${encodeURIComponent(
            platform
          )}&clubName=${encodeURIComponent(query)}`;

          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(eaUrl)}`;

          const res = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(8000) // 8 second timeout
          });

          if (!res.ok) {
            console.error("Proxy returned", res.status);
            setSuggestions([]);
            setShowSuggestions(false);
            return;
          }

          const data = await res.json();

          // Normalize response to array
          let list: any[] = [];
          if (Array.isArray(data)) {
            list = data;
          } else if (data && typeof data === "object") {
            list = Object.values(data);
          }

          // Map to consistent format
          const clubs = list
            .map((c: any) => {
              const clubInfo = c?.clubInfo;
              return {
                clubId: String(c.clubId ?? clubInfo?.clubId ?? c.id ?? ""),
                name: String(c.clubName ?? clubInfo?.name ?? c.name ?? "Unknown"),
              };
            })
            .filter((x) => x.clubId && x.name !== "Unknown");

          setSuggestions(clubs);
          setShowSuggestions(clubs.length > 0);
        } catch (err) {
          console.error("Search error:", err);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, platform]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    // If numeric, go directly to club page
    if (/^\d+$/.test(query.trim())) {
      router.push(`/club/${query.trim()}?platform=${platform}`);
    } else if (suggestions.length > 0) {
      // Go to first suggestion
      router.push(`/club/${suggestions[0].clubId}?platform=${platform}`);
    }
  };

  const handleSuggestionClick = (clubId: string) => {
    router.push(`/club/${clubId}?platform=${platform}`);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchBoxRef} style={{ position: "relative" }}>
      <form onSubmit={handleSubmit}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="Search for clubs..."
            autoComplete="off"
            style={{
              width: "100%",
              background: isFocused ? "#252525" : "#1D1D1D",
              padding: "16px 24px",
              paddingRight: "52px",
              borderRadius: "16px",
              border: isFocused ? "2px solid #00D9FF" : "2px solid transparent",
              fontSize: "16px",
              color: "#FFFFFF",
              fontFamily: "Work Sans, sans-serif",
              outline: "none",
              transition: "all 0.2s ease",
              boxShadow: isFocused
                ? "0 0 0 4px rgba(0, 217, 255, 0.1)"
                : "0 4px 12px rgba(0, 0, 0, 0.4)"
            }}
          />

          {/* Search Icon */}
          <div
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "20px",
              color: "#6B7280",
              pointerEvents: "none"
            }}
          >
            {isSearching ? "⏳" : "🔍"}
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#1D1D1D",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 1000
          }}
        >
          {suggestions.slice(0, 8).map((club, index) => (
            <div
              key={club.clubId}
              onClick={() => handleSuggestionClick(club.clubId)}
              style={{
                padding: "14px 20px",
                borderTop: index === 0 ? "none" : "1px solid rgba(255, 255, 255, 0.05)",
                cursor: "pointer",
                transition: "background 0.15s ease",
                fontFamily: "Work Sans, sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#252525";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  marginBottom: "4px"
                }}
              >
                {club.name}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  fontFamily: "IBM Plex Mono, monospace"
                }}
              >
                Club ID: {club.clubId}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
