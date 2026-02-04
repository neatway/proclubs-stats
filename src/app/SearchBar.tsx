"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

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
  const abortControllerRef = useRef<AbortController | null>(null);
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
        // Cancel previous in-flight request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsSearching(true);
        try {
          const res = await fetch(
            `/api/ea/search-clubs?platform=${encodeURIComponent(platform)}&q=${encodeURIComponent(query)}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error(`Search failed: ${res.status}`);
          const clubs: ClubHit[] = await res.json();
          setSuggestions(clubs);
          setShowSuggestions(clubs.length > 0);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
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
              background: isFocused ? "var(--bg-card-hover)" : "var(--bg-card)",
              padding: "var(--space-md) var(--space-lg)",
              paddingRight: "52px",
              borderRadius: "var(--radius-xl)",
              border: isFocused ? "2px solid var(--brand-cyan)" : "2px solid transparent",
              fontSize: "16px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-work-sans), sans-serif",
              outline: "none",
              transition: "all var(--transition-base)",
              boxShadow: isFocused
                ? "0 0 0 4px var(--brand-cyan-subtle)"
                : "var(--shadow-md)"
            }}
          />

          {/* Search Icon */}
          <div
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-disabled)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center"
            }}
          >
            {isSearching ? (
              <Loader2 width={18} height={18} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Search width={18} height={18} strokeWidth={2} />
            )}
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + var(--space-xs))",
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-subtle)",
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
                padding: "var(--space-sm) var(--space-lg)",
                borderTop: index === 0 ? "none" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "background 0.15s ease",
                fontFamily: "var(--font-work-sans), sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "4px"
                }}
              >
                {club.name}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-disabled)",
                  fontFamily: "var(--font-ibm-plex-mono), monospace"
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
