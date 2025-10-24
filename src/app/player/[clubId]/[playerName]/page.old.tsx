"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { safeJson } from "@/lib/utils";

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const clubId = params.clubId as string;
  const playerName = decodeURIComponent(params.playerName as string);
  const platform = searchParams.get("platform") ?? "common-gen5";

  const [clubStatsData, setClubStatsData] = useState<Record<string, unknown> | null>(null);
  const [careerStatsData, setCareerStatsData] = useState<Record<string, unknown> | null>(null);
  const [clubInfo, setClubInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch both club-specific stats and career stats
      const [clubStatsRes, careerStatsRes, clubInfoRes] = await Promise.all([
        fetch(`/api/ea/members?platform=${platform}&clubId=${clubId}&scope=club`),
        fetch(`/api/ea/members?platform=${platform}&clubId=${clubId}&scope=career`),
        fetch(`/api/ea/club-info?platform=${platform}&clubIds=${clubId}`),
      ]);

      const [clubStatsMembers, careerStatsMembers, clubInfoData] = await Promise.all([
        safeJson(clubStatsRes),
        safeJson(careerStatsRes),
        safeJson(clubInfoRes),
      ]);

      // Extract club info
      if (clubInfoData) {
        const extracted = clubInfoData[clubId] || clubInfoData;
        setClubInfo(extracted);
      }

      // Find the specific player in both lists
      const findPlayer = (data: unknown) => {
        if (!data) return null;
        const dataObj = data as Record<string, unknown>;
        const members = dataObj.members || data;
        if (Array.isArray(members)) {
          return members.find((m: unknown) => {
            const member = m as Record<string, unknown>;
            const memberName = member.name;
            if (typeof memberName === 'string') {
              return memberName.toLowerCase() === playerName.toLowerCase();
            }
            return false;
          });
        }
        return null;
      };

      const clubPlayer = findPlayer(clubStatsMembers);
      const careerPlayer = findPlayer(careerStatsMembers);

      if (clubPlayer || careerPlayer) {
        setClubStatsData(clubPlayer);
        setCareerStatsData(careerPlayer);
      } else {
        setError("Player not found in this club");
      }
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || "Failed to load player data");
    } finally {
      setLoading(false);
    }
  }, [clubId, playerName, platform]);

  useEffect(() => {
    if (!clubId || !playerName) return;
    fetchPlayerData();
  }, [clubId, playerName, fetchPlayerData]);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', paddingTop: '64px', padding: 'var(--space-xl)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
          <div className="skeleton" style={{ width: '200px', height: '30px', margin: '0 auto' }}>
            &nbsp;
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', paddingTop: '64px', padding: 'var(--space-xl)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            color: 'var(--danger)',
            marginBottom: 'var(--space-md)'
          }}>
            {error}
          </div>
          <Link
            href={`/club/${clubId}?platform=${platform}`}
            className="btn btn-secondary"
          >
            Back to Club
          </Link>
        </div>
      </main>
    );
  }

  // Parse numeric values
  const parseNum = (val: unknown) => {
    if (!val) return undefined;
    if (typeof val === "string") return parseInt(val, 10);
    if (typeof val === "number") return val;
    return undefined;
  };

  const parseFloatNum = (val: unknown) => {
    if (!val) return undefined;
    if (typeof val === "string") return parseFloat(val);
    if (typeof val === "number") return val;
    return undefined;
  };

  // Format height as "CM cm (FT'IN")"
  const formatHeight = (cm: number | string | undefined) => {
    if (!cm) return "-";
    const cmNum = typeof cm === "string" ? parseInt(cm, 10) : cm;
    const totalInches = cmNum / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${cmNum} cm (${feet}'${inches}")`;
  };

  // Format number with commas
  const formatWithCommas = (num: number | undefined) => {
    if (num === undefined) return "-";
    return num.toLocaleString();
  };

  // Use club stats as primary, fallback to career if needed
  const clubStats = clubStatsData || {};
  const careerStats = careerStatsData || {};

  // Calculate stats for club stats section
  const calculateStats = (stats: Record<string, unknown>) => {
    const gamesPlayed = parseNum(stats.gamesPlayed) || 0;
    const goals = parseNum(stats.goals) || 0;
    const assists = parseNum(stats.assists) || 0;

    // G+A/90 calculation
    const gaPer90 = gamesPlayed > 0 ? ((goals + assists) / gamesPlayed).toFixed(2) : "-";

    // Clean sheets - use favouritePosition to determine GK
    const favouritePosition = stats.favoritePosition || stats.favouritePosition || "";
    const isGoalkeeper = favouritePosition.toUpperCase() === "GK";
    const cleanSheets = isGoalkeeper
      ? (parseNum(stats.cleanSheetsGK) ?? parseNum(stats.cleanSheets) ?? "-")
      : (parseNum(stats.cleanSheetsDef) ?? parseNum(stats.cleanSheets) ?? "-");

    return {
      gaPer90,
      cleanSheets,
      favouritePosition,
    };
  };

  const clubCalculated = calculateStats(clubStats);
  const careerCalculated = calculateStats(careerStats);

  // Overall rating - subtract 1 from API value
  const displayOverall = clubStats.proOverall ? parseInt(clubStats.proOverall) - 1 : undefined;

  return (
    <main style={{ minHeight: '100vh', paddingTop: '64px', padding: 'var(--space-xl)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {/* Breadcrumb */}
        <Link
          href={`/club/${clubId}?platform=${platform}`}
          className="btn-secondary"
          style={{ display: 'inline-flex', width: 'fit-content' }}
        >
          ← Back to {clubInfo?.name || "Club"}
        </Link>

        {/* Player Header */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-work-sans), sans-serif',
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-sm)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {playerName}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {clubInfo?.name && (
              <>
                Current Club:{" "}
                <Link
                  href={`/club/${clubId}?platform=${platform}`}
                  style={{ color: 'var(--brand-cyan)', textDecoration: 'none' }}
                >
                  {clubInfo.name}
                </Link>
                {" • "}
              </>
            )}
            Platform: {platform === 'common-gen5' ? 'Current Gen' : 'Previous Gen'}
          </p>
        </div>

        {/* Player Info Card */}
        {(clubStats.proName || clubStats.proHeight || clubCalculated.favouritePosition || displayOverall) && (
          <section className="card">
            <h2 className="text-xl font-semibold mb-4 text-primary">Player Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {clubStats.proName && (
                <div>
                  <div className="text-sm text-muted mb-1">Kit Name</div>
                  <div className="text-2xl font-bold text-gradient-cyan">{clubStats.proName}</div>
                </div>
              )}
              {clubCalculated.favouritePosition && (
                <div>
                  <div className="text-sm text-muted mb-1">Position</div>
                  <div className="text-2xl font-bold text-primary">{clubCalculated.favouritePosition}</div>
                </div>
              )}
              {clubStats.proHeight && (
                <div>
                  <div className="text-sm text-muted mb-1">Height</div>
                  <div className="text-2xl font-bold text-primary">{formatHeight(clubStats.proHeight)}</div>
                </div>
              )}
              {displayOverall !== undefined && (
                <div>
                  <div className="text-sm text-muted mb-1">Overall Rating</div>
                  <div className="text-3xl font-bold" style={{ color: 'var(--success)' }}>{displayOverall}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Club Stats */}
        <section className="card">
          <h2 className="text-xl font-semibold mb-4 text-primary">
            Stats with {clubInfo?.name || "Current Club"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Games Played" value={parseNum(clubStats.gamesPlayed) ?? "-"} />
            <StatCard label="Goals" value={parseNum(clubStats.goals) ?? "-"} />
            <StatCard label="Assists" value={parseNum(clubStats.assists) ?? "-"} />
            <StatCard label="G+A/90" value={clubCalculated.gaPer90} />
            <StatCard label="Average Rating" value={parseFloatNum(clubStats.ratingAve)?.toFixed(1) ?? "-"} />
            <StatCard
              label="Win Rate"
              value={clubStats.winRate ? `${clubStats.winRate}%` : "-"}
            />
            <StatCard label="Man of the Match" value={parseNum(clubStats.manOfTheMatch) ?? "-"} />
            <StatCard label="Clean Sheets" value={clubCalculated.cleanSheets} />
            <StatCard
              label="Conversion Rate"
              value={clubStats.shotSuccessRate ? `${clubStats.shotSuccessRate}%` : "-"}
            />
            <StatCard
              label="Passes Made"
              value={formatWithCommas(parseNum(clubStats.passesMade))}
            />
            <StatCard
              label="Pass Success Rate"
              value={clubStats.passSuccessRate ? `${clubStats.passSuccessRate}%` : "-"}
            />
            <StatCard
              label="Tackles Made"
              value={parseNum(clubStats.tacklesMade) ?? "-"}
            />
            <StatCard
              label="Tackle Success Rate"
              value={clubStats.tackleSuccessRate ? `${clubStats.tackleSuccessRate}%` : "-"}
            />
          </div>
        </section>

        {/* Career Stats */}
        <section className="card">
          <h2 className="text-xl font-semibold mb-4 text-primary">Career Totals Across All Clubs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Games" value={parseNum(careerStats.gamesPlayed) ?? "-"} />
            <StatCard label="Total Goals" value={parseNum(careerStats.goals) ?? "-"} />
            <StatCard label="Total Assists" value={parseNum(careerStats.assists) ?? "-"} />
            <StatCard label="G+A/90" value={careerCalculated.gaPer90} />
            <StatCard label="Average Rating" value={parseFloatNum(careerStats.ratingAve)?.toFixed(1) ?? "-"} />
            <StatCard label="Total MOTM" value={parseNum(careerStats.manOfTheMatch) ?? "-"} />
          </div>
        </section>

        {/* Raw Data (for debugging) */}
        {(clubStatsData || careerStatsData) && (
          <details className="card">
            <summary className="text-sm font-medium cursor-pointer text-primary">
              View Raw Data (Debug)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium text-primary mb-2">Club Stats:</h4>
                <pre className="text-xs bg-tertiary p-3 rounded overflow-auto text-secondary">
                  {JSON.stringify(clubStatsData, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">Career Stats:</h4>
                <pre className="text-xs bg-tertiary p-3 rounded overflow-auto text-secondary">
                  {JSON.stringify(careerStatsData, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-tertiary rounded p-3">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-lg font-semibold text-primary">{value}</div>
    </div>
  );
}
