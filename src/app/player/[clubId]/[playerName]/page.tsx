"use client";

import { useEffect, useState } from "react";
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

  const [clubStatsData, setClubStatsData] = useState<any>(null);
  const [careerStatsData, setCareerStatsData] = useState<any>(null);
  const [clubInfo, setClubInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId || !playerName) return;
    fetchPlayerData();
  }, [clubId, playerName, platform]);

  async function fetchPlayerData() {
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
      const findPlayer = (data: any) => {
        if (!data) return null;
        const members = data.members || data;
        if (Array.isArray(members)) {
          return members.find((m: any) => m.name?.toLowerCase() === playerName.toLowerCase());
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
    } catch (e: any) {
      setError(e?.message || "Failed to load player data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center py-12">Loading player data...</div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>
            <Link
              href={`/club/${clubId}?platform=${platform}`}
              className="text-blue-600 hover:underline mt-4 inline-block"
            >
              Back to Club
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Parse numeric values
  const parseNum = (val: any) => {
    if (!val) return undefined;
    return typeof val === "string" ? parseInt(val, 10) : val;
  };

  const parseFloatNum = (val: any) => {
    if (!val) return undefined;
    return typeof val === "string" ? parseFloat(val) : val;
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
  const calculateStats = (stats: any) => {
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
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Link
              href={`/club/${clubId}?platform=${platform}`}
              className="text-sm text-blue-600 hover:underline mb-2 inline-block"
            >
              ← Back to {clubInfo?.name || "Club"}
            </Link>
            <h1 className="text-3xl font-bold text-black">{playerName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {clubInfo?.name && (
                <>
                  Current Club:{" "}
                  <Link
                    href={`/club/${clubId}?platform=${platform}`}
                    className="text-blue-600 hover:underline"
                  >
                    {clubInfo.name}
                  </Link>
                  {" • "}
                </>
              )}
              Platform: {platform}
            </p>
          </div>

          {/* Player Info Card */}
          {(clubStats.proName || clubStats.proHeight || clubCalculated.favouritePosition || displayOverall) && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">Player Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {clubStats.proName && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Kit Name</div>
                    <div className="text-2xl font-bold text-blue-600">{clubStats.proName}</div>
                  </div>
                )}
                {clubCalculated.favouritePosition && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Position</div>
                    <div className="text-2xl font-bold text-gray-900">{clubCalculated.favouritePosition}</div>
                  </div>
                )}
                {clubStats.proHeight && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Height</div>
                    <div className="text-2xl font-bold text-gray-900">{formatHeight(clubStats.proHeight)}</div>
                  </div>
                )}
                {displayOverall !== undefined && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Overall Rating</div>
                    <div className="text-3xl font-bold text-green-600">{displayOverall}</div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Club Stats */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">
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
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Career Totals Across All Clubs</h2>
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
            <details className="bg-white rounded-lg shadow p-6">
              <summary className="text-sm font-medium cursor-pointer text-black">
                View Raw Data (Debug)
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-medium text-black mb-2">Club Stats:</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto text-gray-900">
                    {JSON.stringify(clubStatsData, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-black mb-2">Career Stats:</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto text-gray-900">
                    {JSON.stringify(careerStatsData, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}
