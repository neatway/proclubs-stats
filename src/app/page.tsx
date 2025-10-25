import { Suspense } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import HelpLink from "@/components/HelpLink";
import { getRandomClubs, getRandomPlayers } from "@/lib/homepage-data";
import SearchBar from "./SearchBar";

// Revalidate every hour (3600 seconds)
export const revalidate = 3600;

// Server Component - fetches data on the server
export default async function HomePage() {
  const platform = "common-gen5";

  // Fetch random data from EA API
  const randomClubs = await getRandomClubs();
  const randomPlayers = await getRandomPlayers();

  // Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PROCLUBS.IO",
    "url": "https://proclubs.io",
    "description": "Track EA Sports FC Pro Clubs statistics, player performance, club rankings, and match history",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://proclubs.io/?q={search_term_string}&platform=common-gen5"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        style={{
          minHeight: "100vh",
          padding: "24px"
        }}
      >
        <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0"
        }}
      >
        {/* Logo Section */}
        <div
          className="logo-container"
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "18px",
            paddingBottom: "18px"
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo size="custom" customSize={56} />
          </Link>
        </div>

        {/* Search Bar */}
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto 24px auto"
          }}
        >
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>
        </div>

        {/* Help Link */}
        <HelpLink />

        {/* Three Column Grid */}
        <div
          className="homepage-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px"
          }}
        >
          {/* Column 1: Random Teams */}
          <div
            style={{
              background: "#1D1D1D",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)"
            }}
          >
            <h2
              style={{
                fontFamily: "Work Sans, sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#9CA3AF",
                marginBottom: "20px"
              }}
            >
              Random Teams
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {randomClubs.length > 0 ? (
                randomClubs.map((club) => (
                  <Link
                    key={club.clubId}
                    href={`/club/${club.clubId}?platform=${platform}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "#252525",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      textDecoration: "none",
                      transition: "all 0.2s ease",
                      cursor: "pointer"
                    }}
                    className="homepage-item"
                  >
                    {/* Badge Icon */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "rgba(0, 217, 255, 0.1)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden"
                      }}
                    >
                      <img
                        src={club.badgeUrl}
                        alt={`${club.name} badge`}
                        style={{
                          width: "32px",
                          height: "32px",
                          objectFit: "contain"
                        }}
                      />
                    </div>

                    {/* Club Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "Work Sans, sans-serif",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#FFFFFF",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "4px"
                        }}
                      >
                        {club.name}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#6B7280",
                          display: "flex",
                          gap: "12px",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ color: "#9CA3AF" }}>Division:</span>
                          <span style={{ color: "#FFFFFF", fontWeight: 500 }}>{club.division}</span>
                        </span>
                        <span style={{ color: "rgba(255, 255, 255, 0.1)" }}>|</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ color: "#9CA3AF" }}>SR:</span>
                          <span style={{ color: "#00D9FF", fontWeight: 500 }}>{club.skillRating}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#6B7280",
                    fontSize: "14px"
                  }}
                >
                  No clubs available
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Random Players */}
          <div
            style={{
              background: "#1D1D1D",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)"
            }}
          >
            <h2
              style={{
                fontFamily: "Work Sans, sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#9CA3AF",
                marginBottom: "20px"
              }}
            >
              Random Players
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {randomPlayers.length > 0 ? (
                randomPlayers.map((player, index) => (
                  <Link
                    key={`${player.clubId}-${player.playerName}-${index}`}
                    href={player.url}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "#252525",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      textDecoration: "none",
                      transition: "all 0.2s ease",
                      cursor: "pointer"
                    }}
                    className="homepage-item"
                  >
                    {/* Player Icon */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "rgba(0, 217, 255, 0.1)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden"
                      }}
                    >
                      <img
                        src={player.avatarUrl}
                        alt={`${player.playerName} avatar`}
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          borderRadius: "8px"
                        }}
                      />
                    </div>

                    {/* Player Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "Work Sans, sans-serif",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#FFFFFF",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "4px"
                        }}
                      >
                        {player.playerName}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#6B7280",
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap"
                        }}
                      >
                        <span
                          style={{
                            background: "rgba(0, 217, 255, 0.15)",
                            color: "#00D9FF",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.5px"
                          }}
                        >
                          {player.position}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{player.mainStat.icon}</span>
                          <span style={{ color: "#FFFFFF", fontWeight: 500 }}>{player.mainStat.value}</span>
                        </span>
                        <span style={{ color: "rgba(255, 255, 255, 0.1)" }}>|</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ color: "#9CA3AF" }}>Avg:</span>
                          <span style={{ color: "#00D9FF", fontWeight: 500 }}>{player.avgRating.toFixed(1)}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#6B7280",
                    fontSize: "14px"
                  }}
                >
                  No players available
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Locked Sections */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}
          >
            {/* Locked Section 1 */}
            <div
              style={{
                background: "#1D1D1D",
                borderRadius: "16px",
                padding: "48px 24px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                textAlign: "center",
                border: "2px dashed rgba(255, 255, 255, 0.1)"
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "16px",
                  filter: "grayscale(100%) opacity(0.5)"
                }}
              >
                🔒
              </div>
              <div
                style={{
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}
              >
                Pro Clubs League
              </div>
              <div
                style={{
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                Coming Soon
              </div>
            </div>

            {/* Locked Section 2 */}
            <div
              style={{
                background: "#1D1D1D",
                borderRadius: "16px",
                padding: "48px 24px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                textAlign: "center",
                border: "2px dashed rgba(255, 255, 255, 0.1)"
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "16px",
                  filter: "grayscale(100%) opacity(0.5)"
                }}
              >
                🔒
              </div>
              <div
                style={{
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  lineHeight: 1.3
                }}
              >
                ProClubs.io
                <br />
                ELO Leaderboard
              </div>
              <div
                style={{
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginTop: "8px"
                }}
              >
                Coming Soon
              </div>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "48px",
            padding: "24px",
            fontSize: "12px",
            color: "#6B7280",
            fontFamily: "Work Sans, sans-serif"
          }}
        >
          Unofficial fan project. Random teams and players updated hourly.
        </div>
      </div>
    </main>
    </>
  );
}

// Fallback for SearchBar suspense boundary
function SearchBarFallback() {
  return (
    <div
      style={{
        background: "#1D1D1D",
        padding: "16px 24px",
        borderRadius: "16px",
        border: "2px solid transparent",
        fontSize: "16px",
        color: "#6B7280"
      }}
    >
      Loading search...
    </div>
  );
}
