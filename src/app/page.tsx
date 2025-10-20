"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

type ClubHit = { clubId: string; name: string };

function SearchableHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";
  const platform = searchParams.get("platform") || "common-gen5";

  const [suggestions, setSuggestions] = useState<ClubHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // If query is a numeric clubId, redirect to club page
    if (query && /^\d+$/.test(query.trim())) {
      router.push(`/club/${query.trim()}?platform=${platform}`);
      return;
    }

    // Search for clubs
    if (query.trim().length >= 2) {
      setIsSearching(true);
      const url = `/api/ea/search-clubs?platform=${encodeURIComponent(
        platform
      )}&q=${encodeURIComponent(query)}`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSuggestions(data);
          } else {
            setSuggestions([]);
          }
        })
        .catch(err => {
          console.error("Search error:", err);
          setSuggestions([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [query, platform, router]);

  return (
    <main style={{ minHeight: '100vh', paddingTop: '64px' }}>
      {/* Hero Section with Stadium Background - ONLY ON HOMEPAGE */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Stadium Background Image */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://fifauteam.com/images/stadiums/england/StamfordBridge/3.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0
          }}
        />

        {/* Gradient Overlay - FUT.GG Fade Effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(to bottom,
              rgba(26, 29, 41, 0.4) 0%,
              rgba(26, 29, 41, 0.75) 40%,
              rgba(26, 29, 41, 0.95) 70%,
              rgba(26, 29, 41, 1) 100%
            )`,
            zIndex: 1
          }}
        />

        {/* Hero Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '800px',
            width: '100%',
            padding: '0 24px',
            textAlign: 'center'
          }}
        >
          <h1
            style={{
              fontFamily: 'Work Sans, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(36px, 8vw, 56px)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-xl)',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            SEARCH
          </h1>

          {/* Search Form - Glass Morphism */}
          <form method="get" action="/" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div
              className="glass-morphism"
              style={{
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)'
              }}
            >
              <input
                name="q"
                className="input"
                placeholder="Search for club..."
                defaultValue={query}
                autoComplete="off"
                style={{
                  fontSize: '18px',
                  padding: '16px 24px'
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-md)',
                  flexWrap: 'wrap'
                }}
              >
                <select
                  name="platform"
                  className="input"
                  defaultValue={platform}
                  style={{ flex: 1, minWidth: '200px' }}
                >
                  <option value="common-gen5">Current Gen</option>
                  <option value="common-gen4">Previous Gen</option>
                </select>
                <button type="submit" className="btn btn-primary">
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Search Results */}
          {suggestions.length > 0 && (
            <div className="card" style={{ textAlign: 'left', maxWidth: '700px', margin: '0 auto' }}>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                  {suggestions.length} {suggestions.length === 1 ? "club" : "clubs"} found
                </h3>
              </div>
              <ul style={{ listStyle: 'none' }}>
                {suggestions.slice(0, 10).map((s, idx) => (
                  <li
                    key={s.clubId}
                    style={{
                      borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)'
                    }}
                  >
                    <a
                      href={`/club/${s.clubId}?platform=${platform}`}
                      className="search-result-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md) 0',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'color var(--transition-base)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Club ID: {s.clubId}
                        </div>
                      </div>
                      <svg
                        style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }}
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
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No results message */}
          {query.trim().length >= 2 && suggestions.length === 0 && !isSearching && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                maxWidth: '700px',
                margin: '0 auto'
              }}
            >
              <p style={{ fontSize: '14px', color: 'var(--warning)' }}>
                No clubs found matching &quot;{query}&quot;. Try a different search term.
              </p>
            </div>
          )}

          {/* Searching indicator */}
          {isSearching && (
            <div
              style={{
                background: 'rgba(0, 217, 255, 0.1)',
                border: '1px solid var(--brand-cyan)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                maxWidth: '700px',
                margin: '0 auto'
              }}
            >
              <p style={{ fontSize: '14px', color: 'var(--brand-cyan)' }}>
                Searching...
              </p>
            </div>
          )}

          {/* Welcome message */}
          {!query.trim() && (
            <div
              className="glass-morphism"
              style={{
                padding: 'var(--space-xl)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '700px',
                margin: '0 auto'
              }}
            >
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: 'var(--space-md)',
                  color: 'var(--text-primary)'
                }}
              >
                Welcome to Pro Clubs Stats
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-lg)',
                  lineHeight: 1.6
                }}
              >
                Search for any EA Sports FC Pro Clubs team to view detailed statistics, member
                rosters, and match history.
              </p>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-sm)',
                  textAlign: 'left'
                }}
              >
                <p>• Search by club name for suggestions</p>
                <p>• Enter a numeric Club ID directly to view that club</p>
                <p>• Click on player names to view individual career stats</p>
                <p>• Click on opponent names in match history to view their clubs</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <div
        style={{
          padding: 'var(--space-xl)',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}
      >
        Unofficial fan project. Data via EA Pro Clubs web API. Some endpoints may return
        empty bodies; results are cached briefly.
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </main>
    }>
      <SearchableHome />
    </Suspense>
  );
}
