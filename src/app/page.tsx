import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getRandomClubs, getRandomPlayers } from "@/lib/homepage-data";
import { capitalizeFirst } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { Trophy, BarChart3, Target, Handshake, ShieldCheck, Hand, ChevronRight, CircleHelp, Globe } from "lucide-react";

export const revalidate = 86400;

// Division color mapping
function getDivisionColor(division: string): string {
  switch (division) {
    case "Elite": return "#D4A843";
    case "Div 1": return "#A0A0A0";
    case "Div 2": return "#8B5CF6";
    case "Div 3": return "#10B981";
    case "Div 4": return "#3B82F6";
    case "Div 5": return "#6B7280";
    default: return "#6B7280";
  }
}

// Position color mapping
function getPositionColor(position: string): string {
  const pos = position.toLowerCase();
  if (pos === "goalkeeper" || pos === "gk") return "#10B981";
  if (pos === "defender" || ["cb", "lb", "rb", "lwb", "rwb"].includes(pos)) return "#3B82F6";
  if (pos === "midfielder" || ["cam", "cm", "cdm", "lm", "rm"].includes(pos)) return "#8B5CF6";
  if (pos === "forward" || ["st", "cf", "lw", "rw"].includes(pos)) return "#EF4444";
  return "#6B7280";
}

// Stat icon component
function StatIcon({ type }: { type: string }) {
  const size = 13;
  const props = { width: size, height: size, strokeWidth: 1.8 };
  switch (type) {
    case "goal": return <Target {...props} />;
    case "assist": return <Handshake {...props} />;
    case "tackle": return <ShieldCheck {...props} />;
    case "cleansheet": return <Hand {...props} />;
    default: return <Target {...props} />;
  }
}

export default async function HomePage() {
  const platform = "common-gen5";

  const randomClubs = await getRandomClubs();
  const randomPlayers = await getRandomPlayers();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PROCLUBS.IO",
    url: "https://proclubs.io",
    description: "Track EA Sports FC Pro Clubs statistics, player performance, club rankings, and match history",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://proclubs.io/?q={search_term_string}&platform=common-gen5",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="hp-main">
        <div className="hp-container">

          {/* Hero */}
          <section className="hp-hero">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Image
                src="/images/logo.png"
                alt="PROCLUBS.IO"
                width={52}
                height={52}
                style={{ objectFit: "contain" }}
                priority
              />
            </Link>

            <p className="hp-tagline">EA FC Pro Clubs Stats Tracker</p>

            <div className="hp-search-wrap">
              <Suspense fallback={<SearchBarFallback />}>
                <SearchBar />
              </Suspense>
            </div>

            <Link href="/help" className="hp-help-pill">
              <CircleHelp width={14} height={14} strokeWidth={1.8} />
              How does this work?
            </Link>
          </section>

          {/* Stats Ticker */}
          <div className="hp-ticker">
            <div className="hp-ticker-item">
              <span className="hp-ticker-value">{randomClubs.length > 0 ? "12,450+" : "\u2014"}</span>
              <span className="hp-ticker-label">Clubs Tracked</span>
            </div>
            <div className="hp-ticker-sep" />
            <div className="hp-ticker-item">
              <span className="hp-ticker-value">{randomPlayers.length > 0 ? "89,200+" : "\u2014"}</span>
              <span className="hp-ticker-label">Players Indexed</span>
            </div>
            <div className="hp-ticker-sep" />
            <div className="hp-ticker-item">
              <span className="hp-ticker-value">
                <Globe width={14} height={14} strokeWidth={1.8} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                Cross-Platform
              </span>
              <span className="hp-ticker-label">PS5 / Xbox / PC</span>
            </div>
          </div>

          {/* Content Grid */}
          <div className="hp-grid">

            {/* Left: Clubs */}
            <section className="hp-section">
              <h2 className="hp-section-header">
                <span>Clubs of the Day</span>
                <span className="hp-section-rule" />
              </h2>

              <div className="hp-list">
                {randomClubs.length > 0 ? (
                  randomClubs.map((club) => (
                    <Link
                      key={club.clubId}
                      href={`/club/${club.clubId}?platform=${platform}`}
                      className="hp-card"
                    >
                      <div className="hp-card-badge">
                        <img
                          src={club.badgeUrl}
                          alt={`${club.name} badge`}
                          style={{ width: "32px", height: "32px", objectFit: "contain" }}
                        />
                      </div>

                      <div className="hp-card-info">
                        <div className="hp-card-name">{club.name}</div>
                        <div className="hp-card-meta">
                          <span
                            className="hp-pill"
                            style={{
                              background: `${getDivisionColor(club.division)}15`,
                              color: getDivisionColor(club.division),
                              borderColor: `${getDivisionColor(club.division)}30`,
                            }}
                          >
                            {club.division}
                          </span>
                          <span className="hp-card-sr">
                            SR <strong>{club.skillRating}</strong>
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="hp-card-chevron" width={15} height={15} strokeWidth={1.8} />
                    </Link>
                  ))
                ) : (
                  <div className="hp-empty">
                    <span>No clubs available right now</span>
                    <span className="hp-empty-sub">EA servers may be down</span>
                  </div>
                )}
              </div>
            </section>

            {/* Right: Players */}
            <section className="hp-section">
              <h2 className="hp-section-header">
                <span>Players of the Day</span>
                <span className="hp-section-rule" />
              </h2>

              <div className="hp-list">
                {randomPlayers.length > 0 ? (
                  randomPlayers.map((player, index) => (
                    <Link
                      key={`${player.clubId}-${player.playerName}-${index}`}
                      href={player.url}
                      className="hp-card"
                    >
                      <div className="hp-card-avatar">
                        <img
                          src={player.avatarUrl}
                          alt={player.playerName}
                          style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "50%" }}
                        />
                      </div>

                      <div className="hp-card-info">
                        <div className="hp-card-name">{player.playerName}</div>
                        <div className="hp-card-meta">
                          <span
                            className="hp-pill"
                            style={{
                              background: `${getPositionColor(player.position)}15`,
                              color: getPositionColor(player.position),
                              borderColor: `${getPositionColor(player.position)}30`,
                            }}
                          >
                            {capitalizeFirst(player.position)}
                          </span>
                          <span className="hp-card-stat">
                            <StatIcon type={player.mainStat.icon} /> {player.mainStat.value}
                          </span>
                          <span className="hp-card-rating">
                            {player.avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="hp-card-chevron" width={15} height={15} strokeWidth={1.8} />
                    </Link>
                  ))
                ) : (
                  <div className="hp-empty">
                    <span>No players available right now</span>
                    <span className="hp-empty-sub">EA servers may be down</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Coming Soon */}
          <div className="hp-coming-soon">
            <div className="hp-coming-soon-item">
              <div className="hp-coming-soon-icon">
                <Trophy width={22} height={22} strokeWidth={1.5} />
              </div>
              <div className="hp-coming-soon-text">
                <strong>Pro Clubs Leagues</strong>
                <span>Coming Soon</span>
              </div>
            </div>
            <div className="hp-coming-soon-divider" />
            <div className="hp-coming-soon-item">
              <div className="hp-coming-soon-icon">
                <BarChart3 width={22} height={22} strokeWidth={1.5} />
              </div>
              <div className="hp-coming-soon-text">
                <strong>ELO Leaderboard</strong>
                <span>Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="hp-footer">
            Unofficial fan project. Not affiliated with EA Sports. Random clubs and players rotate daily.
          </footer>

        </div>
      </main>
    </>
  );
}

function SearchBarFallback() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        padding: "var(--space-md) var(--space-lg)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        fontSize: "14px",
        color: "var(--text-disabled)",
      }}
    >
      Loading search...
    </div>
  );
}
