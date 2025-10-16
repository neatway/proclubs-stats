"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { safeJson, normalizeMembers, formatResult, getResultColor, formatDate, extractClubInfo, parseIntSafe, getClubBadgeUrl, getDivisionBadgeUrl, getDivisionName } from "@/lib/utils";
import { ClubInfo, NormalizedMember } from "@/types/ea-api";

export default function ClubPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clubId = params.clubId as string;
  const platform = searchParams.get("platform") ?? "common-gen5";

  const [clubInfo, setClubInfo] = useState<any>(null);
  const [clubStats, setClubStats] = useState<any>(null);
  const [playoffAchievements, setPlayoffAchievements] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [members, setMembers] = useState<NormalizedMember[]>([]);
  const [matches, setMatches] = useState<{ league: any[]; playoff: any[]; friendly: any[] }>({
    league: [],
    playoff: [],
    friendly: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"club" | "career">("club");
  const [matchTab, setMatchTab] = useState<"league" | "playoff" | "friendly">("league");

  const fetchClubData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [infoRes, statsRes, playoffRes, membersRes, leagueMatchesRes, playoffMatchesRes, friendlyMatchesRes] = await Promise.all([
        fetch(`/api/ea/club-info?platform=${platform}&clubIds=${clubId}`),
        fetch(`/api/ea/club-stats?platform=${platform}&clubIds=${clubId}`),
        fetch(`/api/ea/playoff-achievements?platform=${platform}&clubId=${clubId}`),
        fetch(`/api/ea/members?platform=${platform}&clubId=${clubId}&scope=${scope}`),
        fetch(`/api/ea/matches?platform=${platform}&clubIds=${clubId}&matchType=leagueMatch`),
        fetch(`/api/ea/matches?platform=${platform}&clubIds=${clubId}&matchType=playoffMatch`),
        fetch(`/api/ea/matches?platform=${platform}&clubIds=${clubId}&matchType=friendlyMatch`),
      ]);

      if (!infoRes.ok) throw new Error("Failed to fetch club info");

      const [infoData, statsData, playoffData, membersData, leagueMatches, playoffMatches, friendlyMatches] = await Promise.all([
        safeJson(infoRes),
        safeJson(statsRes),
        safeJson(playoffRes),
        safeJson(membersRes),
        safeJson(leagueMatchesRes),
        safeJson(playoffMatchesRes),
        safeJson(friendlyMatchesRes),
      ]);

      if (!infoData) throw new Error("Club not found");

      console.log("Raw infoData:", infoData);
      console.log("Raw statsData:", statsData);
      console.log("Raw playoffData:", playoffData);
      console.log("Raw membersData:", membersData);

      const extractedInfo = extractClubInfo(infoData, clubId);
      const extractedStats = extractClubInfo(statsData, clubId);
      console.log("Extracted club info:", extractedInfo);
      console.log("Extracted club stats:", extractedStats);
      setClubInfo(extractedInfo);
      setClubStats(extractedStats);
      setPlayoffAchievements(Array.isArray(playoffData) && playoffData.length > 0 ? playoffData : null);

      // Fetch leaderboard data for division and skill rating info
      if (extractedInfo?.name) {
        try {
          const leaderboardRes = await fetch(
            `/api/ea/club-leaderboard?platform=${platform}&clubName=${encodeURIComponent(extractedInfo.name)}`
          );
          if (leaderboardRes.ok) {
            const leaderboardJson = await safeJson(leaderboardRes);
            console.log("Leaderboard data:", leaderboardJson);

            // Find the matching club in the leaderboard results
            let clubLeaderboardData = null;
            if (Array.isArray(leaderboardJson)) {
              clubLeaderboardData = leaderboardJson.find((c: any) => String(c.clubId) === String(clubId));
            } else if (leaderboardJson && typeof leaderboardJson === "object") {
              const values = Object.values(leaderboardJson);
              clubLeaderboardData = values.find((c: any) => String(c.clubId) === String(clubId));
            }

            if (clubLeaderboardData) {
              setLeaderboardData(clubLeaderboardData);
              console.log("Found club in leaderboard:", clubLeaderboardData);
            }
          }
        } catch (e) {
          console.warn("Failed to fetch leaderboard data:", e);
          // Don't fail the whole page if leaderboard fetch fails
        }
      }

      const normalizedMembers = normalizeMembers(membersData, scope);
      console.log("Normalized members:", normalizedMembers);
      // Sort members by games played (descending)
      const sortedMembers = normalizedMembers.sort((a, b) => {
        const aGames = parseInt(String(a.gamesPlayed || a.appearances || "0"));
        const bGames = parseInt(String(b.gamesPlayed || b.appearances || "0"));
        return bGames - aGames;
      });
      setMembers(sortedMembers);

      setMatches({
        league: Array.isArray(leagueMatches) ? leagueMatches : [],
        playoff: Array.isArray(playoffMatches) ? playoffMatches : [],
        friendly: Array.isArray(friendlyMatches) ? friendlyMatches : [],
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load club data");
    } finally {
      setLoading(false);
    }
  }, [clubId, platform, scope]);

  useEffect(() => {
    if (!clubId) return;
    fetchClubData();
  }, [clubId, fetchClubData]);

  // Memoize expensive calculations - MUST be before early returns to follow Rules of Hooks
  const stats = useMemo(() => {
    // Calculate win/draw/loss percentages - PARSE STRINGS CORRECTLY
    const wins = parseIntSafe(clubStats?.wins);
    const draws = parseIntSafe(clubStats?.ties || clubStats?.draws); // EA uses "ties" not "draws"
    const losses = parseIntSafe(clubStats?.losses);
    const totalMatches = wins + draws + losses;

    const winPercent = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : "0.0";
    const drawPercent = totalMatches > 0 ? ((draws / totalMatches) * 100).toFixed(1) : "0.0";
    const lossPercent = totalMatches > 0 ? ((losses / totalMatches) * 100).toFixed(1) : "0.0";

    const goalsScored = parseIntSafe(clubStats?.goals || clubStats?.goalsFor);
    const goalsConceded = parseIntSafe(clubStats?.goalsAgainst || clubStats?.ga);
    const goalDifference = goalsScored - goalsConceded;

    return {
      wins,
      draws,
      losses,
      totalMatches,
      winPercent,
      drawPercent,
      lossPercent,
      goalsScored,
      goalsConceded,
      goalDifference,
    };
  }, [clubStats]);

  // Get club badge URL - uses selectedKitType to determine which ID to use
  const clubBadgeUrl = useMemo(() => getClubBadgeUrl(clubInfo), [clubInfo]);

  // Calculate form (last 5 games) from all matches
  const clubForm = useMemo(() => {
    const allMatches = [...matches.league, ...matches.playoff, ...matches.friendly];
    if (allMatches.length === 0) return [];

    // Sort by timestamp (newest first) and take last 5
    const sortedMatches = allMatches
      .filter(m => m.timestamp)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);

    return sortedMatches.map(match => {
      const clubs = match.clubs || {};
      const currentClub = clubs[clubId];
      if (!currentClub) return null;

      // Determine W/D/L
      if (currentClub.matchType === "5") {
        // Friendly match
        const goalsFor = parseInt(currentClub.goals || "0");
        const goalsAgainst = parseInt(currentClub.goalsAgainst || "0");
        if (goalsFor > goalsAgainst) return "W";
        if (goalsFor < goalsAgainst) return "L";
        return "D";
      } else {
        // League/playoff match
        if (currentClub.result === "1") return "W";
        if (currentClub.result === "2") return "L";
        if (currentClub.result === "0") return "D";
        if (currentClub.wins === "1") return "W";
        if (currentClub.losses === "1") return "L";
        if (currentClub.ties === "1") return "D";
      }
      return null;
    }).filter(Boolean).reverse(); // Reverse to show oldest to newest (left to right)
  }, [matches, clubId]);

  // Get last match for showcase
  const lastMatch = useMemo(() => {
    const allMatches = [...matches.league, ...matches.playoff, ...matches.friendly];
    if (allMatches.length === 0) return null;

    // Sort by timestamp (newest first) and get the first one
    const sortedMatches = allMatches
      .filter(m => m.timestamp)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (sortedMatches.length === 0) return null;

    const match = sortedMatches[0];
    const clubs = match.clubs || {};
    const clubIds = Object.keys(clubs);
    const currentClub = clubs[clubId];
    const opponentId = clubIds.find((id) => id !== clubId);
    const opponent = opponentId ? clubs[opponentId] : null;

    if (!currentClub || !opponent) return null;

    // Determine result
    let result = "?";
    if (currentClub.matchType === "5") {
      const goalsFor = parseInt(currentClub.goals || "0");
      const goalsAgainst = parseInt(currentClub.goalsAgainst || "0");
      if (goalsFor > goalsAgainst) result = "W";
      else if (goalsFor < goalsAgainst) result = "L";
      else result = "D";
    } else {
      if (currentClub.result === "1") result = "W";
      else if (currentClub.result === "2") result = "L";
      else if (currentClub.result === "0") result = "D";
      else if (currentClub.wins === "1") result = "W";
      else if (currentClub.losses === "1") result = "L";
      else if (currentClub.ties === "1") result = "D";
    }

    // Find top scorer and MOTM from match players
    const players = match.players?.[clubId] || {};
    const playerList: any[] = Object.values(players);

    const topScorer = playerList.reduce((prev, curr) => {
      const prevGoals = parseInt(prev?.goals || "0");
      const currGoals = parseInt(curr?.goals || "0");
      return currGoals > prevGoals ? curr : prev;
    }, playerList[0]);

    const motm = playerList.find((p: any) => p.mom === "1");

    return {
      match,
      currentClub,
      opponent,
      opponentId,
      result,
      topScorer,
      motm,
    };
  }, [matches, clubId]);

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">Loading club data...</div>
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
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>
            <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
              Back to Search
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <Link
              href="/"
              className="text-sm text-blue-600 hover:underline mb-4 inline-block"
            >
              ← Back to Search
            </Link>
            <div className="flex items-start gap-6">
              {/* Club Badge */}
              <div className="flex-shrink-0">
                <img
                  src={clubBadgeUrl}
                  alt={clubInfo?.name || "Club Badge"}
                  className="w-24 h-24 object-contain"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to default not found badge
                    e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
                  }}
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black mb-2">
                  {clubInfo?.name || "Club Profile"}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-black">
                  <span>Platform: <span className="font-medium">{platform}</span></span>
                  <span>Club ID: <span className="font-medium">{clubId}</span></span>
                  {clubStats?.skillRating && (
                    <span>Skill Rating: <span className="font-medium">{parseIntSafe(clubStats.skillRating)}</span></span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Division & Rating Section */}
          {leaderboardData && (leaderboardData.currentDivision || leaderboardData.skillRating) && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">Division & Rating</h2>

              {/* World Rank Badge - Only for Top 100 */}
              {leaderboardData.rank && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🏆</span>
                    <span className="text-2xl font-bold text-amber-600">
                      Top #{parseIntSafe(leaderboardData.rank)} in the World
                    </span>
                    <span className="text-3xl">🏆</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Division */}
                {leaderboardData.currentDivision && (
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Current Division</h3>
                    <img
                      src={getDivisionBadgeUrl(leaderboardData.currentDivision) || ""}
                      alt={`Division ${leaderboardData.currentDivision}`}
                      className="w-20 h-20 object-contain mb-2"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="text-xl font-bold text-black">
                      {getDivisionName(leaderboardData.currentDivision)}
                    </div>
                  </div>
                )}

                {/* Highest Division */}
                {leaderboardData.bestDivision && (
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Highest Division</h3>
                    <img
                      src={getDivisionBadgeUrl(leaderboardData.bestDivision) || ""}
                      alt={`Division ${leaderboardData.bestDivision}`}
                      className="w-20 h-20 object-contain mb-2"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="text-xl font-bold text-black">
                      {getDivisionName(leaderboardData.bestDivision)}
                    </div>
                  </div>
                )}

                {/* Skill Rating */}
                {leaderboardData.skillRating && (
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Skill Rating</h3>
                    <div className="text-4xl font-bold text-blue-600">
                      {parseIntSafe(leaderboardData.skillRating)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Form Indicator & Last Match - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Indicator */}
            {clubForm.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-black">Recent Form</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {clubForm.map((result, idx) => (
                    <span
                      key={idx}
                      className={`inline-block px-3 py-2 rounded font-bold text-white min-w-[40px] text-center ${
                        result === "W"
                          ? "bg-green-500"
                          : result === "D"
                          ? "bg-gray-500"
                          : "bg-red-500"
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Last 5 matches (oldest to newest)</p>
              </section>
            )}

            {/* Last Match Showcase */}
            {lastMatch && (
              <section className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                lastMatch.result === "W"
                  ? "border-green-500"
                  : lastMatch.result === "D"
                  ? "border-gray-500"
                  : "border-red-500"
              }`}>
                <h2 className="text-xl font-semibold mb-4 text-black">Last Match</h2>
                <div className="space-y-3">
                  {/* Score Line */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={clubBadgeUrl}
                        alt={clubInfo?.name}
                        className="w-8 h-8 object-contain"
                        loading="lazy"
                      />
                      <span className="font-bold">{clubInfo?.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-black">
                      {lastMatch.currentClub.goals || 0} - {lastMatch.opponent.goals || 0}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{lastMatch.opponent.details?.name || "Opponent"}</span>
                      <img
                        src={getClubBadgeUrl(lastMatch.opponent.details)}
                        alt={lastMatch.opponent.details?.name}
                        className="w-8 h-8 object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
                        }}
                      />
                    </div>
                  </div>

                  {/* Result Badge */}
                  <div className="flex justify-center">
                    <span className={`inline-block px-4 py-1 rounded font-bold text-white ${
                      lastMatch.result === "W"
                        ? "bg-green-500"
                        : lastMatch.result === "D"
                        ? "bg-gray-500"
                        : "bg-red-500"
                    }`}>
                      {lastMatch.result === "W" ? "WIN ✓" : lastMatch.result === "D" ? "DRAW" : "LOSS"}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="text-sm text-gray-600 text-center">
                    {formatDate(lastMatch.match.timestamp)}
                  </div>

                  {/* Top Scorer & MOTM */}
                  {(lastMatch.topScorer || lastMatch.motm) && (
                    <div className="text-sm space-y-1 border-t pt-3">
                      {lastMatch.topScorer && parseInt(lastMatch.topScorer.goals || "0") > 0 && (
                        <div className="text-black">
                          Top Scorer: <span className="font-semibold">{lastMatch.topScorer.playername}</span> ({lastMatch.topScorer.goals} {parseInt(lastMatch.topScorer.goals) === 1 ? "goal" : "goals"})
                        </div>
                      )}
                      {lastMatch.motm && (
                        <div className="text-black">
                          MOTM: <span className="font-semibold">{lastMatch.motm.playername}</span> ({parseFloat(lastMatch.motm.rating || "0").toFixed(1)} rating)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Club Stats Card */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Club Statistics</h2>

            {/* Debug: Show all available fields */}
            <details className="mb-4 text-xs">
              <summary className="cursor-pointer text-blue-600">Debug: View stats data</summary>
              <pre className="bg-gray-100 p-2 mt-2 rounded overflow-auto text-black">
                {JSON.stringify(clubStats, null, 2)}
              </pre>
            </details>

            {clubStats ? (
              <>
                {/* Overall Record */}
                <div className="mb-6">
                  <h3 className="font-medium text-black mb-3">Overall Record</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <StatCard label="Total Matches" value={stats.totalMatches} />
                    <StatCard label="Wins" value={stats.wins} />
                    <StatCard label="Draws" value={stats.draws} />
                    <StatCard label="Losses" value={stats.losses} />
                    <StatCard label="Win %" value={`${stats.winPercent}%`} />
                    <StatCard label="Draw %" value={`${stats.drawPercent}%`} />
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Loss %" value={`${stats.lossPercent}%`} />
                    <StatCard label="League Apps" value={parseIntSafe(clubStats?.leagueAppearances || clubStats?.leagueApps)} />
                    <StatCard label="Playoff Apps" value={parseIntSafe(clubStats?.gamesPlayedPlayoff || clubStats?.playoffApps)} />
                  </div>
                </div>

                {/* Goals & Performance */}
                <div className="mb-6">
                  <h3 className="font-medium text-black mb-3">Goals & Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Goals Scored" value={stats.goalsScored} />
                    <StatCard label="Goals Conceded" value={stats.goalsConceded} />
                    <StatCard
                      label="Goal Difference"
                      value={`${stats.goalDifference >= 0 ? '+' : ''}${stats.goalDifference}`}
                    />
                    <StatCard label="Clean Sheets" value={parseIntSafe(clubStats?.cleanSheets || clubStats?.cleansheets)} />
                  </div>
                </div>

                {/* Club Progress & Achievements */}
                <div>
                  <h3 className="font-medium text-black mb-3">Club Progress & Achievements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Skill Rating" value={parseIntSafe(clubStats?.skillRating || clubStats?.skillrating)} />
                    <StatCard label="Best Division" value={clubStats?.bestDivision || "-"} />
                    <StatCard label="Promotions" value={parseIntSafe(clubStats?.promotions)} />
                    <StatCard label="Relegations" value={parseIntSafe(clubStats?.relegations)} />
                    <StatCard label="Titles Won" value={parseIntSafe(clubStats?.titlesWon || clubStats?.titles)} />
                    <StatCard label="Win Streak" value={parseIntSafe(clubStats?.wstreak)} />
                    <StatCard label="Unbeaten Streak" value={parseIntSafe(clubStats?.unbeatenstreak)} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-black text-center py-8">No club stats available</div>
            )}
          </section>

          {/* Playoff Achievements Section */}
          {playoffAchievements && playoffAchievements.length > 0 && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">Playoff Achievements</h2>
              <div className="space-y-4">
                {playoffAchievements.map((achievement: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {Object.entries(achievement).map(([key, value]) => {
                        if (key === 'clubId') return null;
                        return (
                          <div key={key}>
                            <span className="text-black font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>{' '}
                            <span className="text-black">{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Members Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black">Team Members</h2>
              <select
                className="border rounded px-3 py-1 text-sm text-black"
                value={scope}
                onChange={(e) => setScope(e.target.value as "club" | "career")}
              >
                <option value="club">Club Stats</option>
                <option value="career">Career Stats</option>
              </select>
            </div>

            {/* Debug: Show first member structure */}
            {members.length > 0 && (
              <details className="mb-4 text-xs">
                <summary className="cursor-pointer text-blue-600">Debug: View first member structure</summary>
                <pre className="bg-gray-100 p-2 mt-2 rounded overflow-auto text-black">
                  {JSON.stringify(members[0], null, 2)}
                </pre>
              </details>
            )}

            {members.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left border-b">
                      <th className="py-3 px-4 font-medium text-black">Player</th>
                      <th className="py-3 px-4 font-medium text-black">Pos</th>
                      <th className="py-3 px-4 font-medium text-black">Overall</th>
                      <th className="py-3 px-4 font-medium text-black">Apps</th>
                      <th className="py-3 px-4 font-medium text-black">Win %</th>
                      <th className="py-3 px-4 font-medium text-black">Goals</th>
                      <th className="py-3 px-4 font-medium text-black">Assists</th>
                      <th className="py-3 px-4 font-medium text-black">Rating</th>
                      <th className="py-3 px-4 font-medium text-black">Clean Sheets</th>
                      <th className="py-3 px-4 font-medium text-black">MOTM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, idx) => {
                      // Clean sheets logic: Use cleanSheetsGK for goalkeepers (proPos="0"), cleanSheetsDef for field players
                      const isGoalkeeper = member.proPos === "0" || member.proPos === 0;
                      const cleanSheets = isGoalkeeper
                        ? (member.cleanSheetsGK ?? member.cleanSheets ?? "-")
                        : (member.cleanSheetsDef ?? member.cleanSheets ?? "-");

                      return (
                        <tr
                          key={member.personaId || idx}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            router.push(
                              `/player/${clubId}/${encodeURIComponent(member.name)}?platform=${platform}`
                            );
                          }}
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium text-blue-600 hover:underline">
                              {member.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-black">{member.pos || member.proPos || "-"}</td>
                          <td className="py-3 px-4 text-black font-semibold">{member.proOverall || "-"}</td>
                          <td className="py-3 px-4 text-black">{member.gamesPlayed || member.appearances || "-"}</td>
                          <td className="py-3 px-4 text-black">{member.winRate ? `${member.winRate}%` : "-"}</td>
                          <td className="py-3 px-4 text-black">{member.goals ?? "-"}</td>
                          <td className="py-3 px-4 text-black">{member.assists ?? "-"}</td>
                          <td className="py-3 px-4 text-black">
                            {member.ratingAve
                              ? typeof member.ratingAve === "number"
                                ? member.ratingAve.toFixed(2)
                                : member.ratingAve
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-black">{cleanSheets}</td>
                          <td className="py-3 px-4 text-black">{member.manOfTheMatch || member.mom || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-black text-center py-8">No member data available</div>
            )}
          </section>

          {/* Match History */}
          {(matches.league.length > 0 || matches.playoff.length > 0 || matches.friendly.length > 0) && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">Recent Matches</h2>

              {/* Match Type Tabs */}
              <div className="flex space-x-2 mb-4 border-b">
                <button
                  onClick={() => setMatchTab("league")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    matchTab === "league"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-black hover:text-blue-600"
                  }`}
                >
                  League ({matches.league.length})
                </button>
                <button
                  onClick={() => setMatchTab("playoff")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    matchTab === "playoff"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-black hover:text-blue-600"
                  }`}
                >
                  Playoff ({matches.playoff.length})
                </button>
                <button
                  onClick={() => setMatchTab("friendly")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    matchTab === "friendly"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-black hover:text-blue-600"
                  }`}
                >
                  Friendly ({matches.friendly.length})
                </button>
              </div>

              {/* Match Tables */}
              {matchTab === "league" && (
                matches.league.length > 0 ? (
                  <MatchTable matches={matches.league} currentClubId={clubId} platform={platform} />
                ) : (
                  <div className="text-black text-center py-8">No league matches found</div>
                )
              )}

              {matchTab === "playoff" && (
                matches.playoff.length > 0 ? (
                  <MatchTable matches={matches.playoff} currentClubId={clubId} platform={platform} />
                ) : (
                  <div className="text-black text-center py-8">No playoff matches found</div>
                )
              )}

              {matchTab === "friendly" && (
                matches.friendly.length > 0 ? (
                  <MatchTable matches={matches.friendly} currentClubId={clubId} platform={platform} />
                ) : (
                  <div className="text-black text-center py-8">No friendly matches found</div>
                )
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

const StatCard = React.memo(({ label, value }: { label: string; value: string | number }) => {
  return (
    <div className="bg-gray-50 rounded p-3">
      <div className="text-xs text-black mb-1">{label}</div>
      <div className="text-lg font-semibold text-black">{value}</div>
    </div>
  );
});

function MatchTable({
  matches,
  currentClubId,
  platform,
}: {
  matches: any[];
  currentClubId: string;
  platform: string;
}) {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left border-b">
            <th className="py-2 px-3 font-medium text-black">Date</th>
            <th className="py-2 px-3 font-medium text-black">Opponent</th>
            <th className="py-2 px-3 font-medium text-black">Score</th>
            <th className="py-2 px-3 font-medium text-black">Result</th>
            <th className="py-2 px-3 font-medium text-black">Details</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, idx) => {
            const clubs = match.clubs || {};
            const clubIds = Object.keys(clubs);
            const currentClub = clubs[currentClubId];
            const opponentId = clubIds.find((id) => id !== currentClubId);
            const opponent = opponentId ? clubs[opponentId] : null;

            if (!currentClub || !opponent) return null;

            // Get result - handle friendly matches separately
            const getMatchResult = () => {
              // Friendly matches have matchType === "5" and don't populate wins/losses/ties
              if (currentClub.matchType === "5") {
                const goalsFor = parseInt(currentClub.goals || "0");
                const goalsAgainst = parseInt(currentClub.goalsAgainst || "0");

                if (goalsFor > goalsAgainst) {
                  return { text: "W", color: "bg-green-100 text-green-800" };
                } else if (goalsFor < goalsAgainst) {
                  return { text: "L", color: "bg-red-100 text-red-800" };
                } else {
                  return { text: "D", color: "bg-gray-100 text-gray-800" };
                }
              } else {
                // League/playoff matches - use result field
                if (currentClub.result === "1") return { text: "W", color: "bg-green-100 text-green-800" };
                if (currentClub.result === "2") return { text: "L", color: "bg-red-100 text-red-800" };
                if (currentClub.result === "0") return { text: "D", color: "bg-gray-100 text-gray-800" };

                // Fallback to wins/losses/ties if result field not available
                if (currentClub.wins === "1") return { text: "W", color: "bg-green-100 text-green-800" };
                if (currentClub.losses === "1") return { text: "L", color: "bg-red-100 text-red-800" };
                if (currentClub.ties === "1") return { text: "D", color: "bg-gray-100 text-gray-800" };

                return { text: "?", color: "bg-gray-100 text-gray-600" };
              }
            };

            const result = getMatchResult();

            // Get opponent badge URL - uses selectedKitType to determine which ID to use
            const opponentBadgeUrl = getClubBadgeUrl(opponent.details);

            const matchId = match.matchId || `match-${idx}`;
            const isExpanded = expandedMatch === matchId;

            return (
              <React.Fragment key={matchId}>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 text-black">{formatDate(match.timestamp)}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={opponentBadgeUrl}
                        alt={opponent.details?.name || "Badge"}
                        className="w-6 h-6 object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
                        }}
                      />
                      <Link
                        href={`/club/${opponentId}?platform=${platform}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {opponent.details?.name || opponent.name || `Club ${opponentId}`}
                      </Link>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-black font-medium">
                    {currentClub.goals ?? 0} - {opponent.goals ?? 0}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${result.color}`}
                    >
                      {result.text}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => setExpandedMatch(isExpanded ? null : matchId)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      {isExpanded ? "Hide Players" : "Show Players"}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <MatchPlayerStats
                        match={match}
                        currentClubId={currentClubId}
                        opponentId={opponentId || ""}
                        platform={platform}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MatchPlayerStats({
  match,
  currentClubId,
  opponentId,
  platform,
}: {
  match: any;
  currentClubId: string;
  opponentId: string;
  platform: string;
}) {
  const currentClubPlayers = match.players?.[currentClubId] || {};
  const opponentPlayers = match.players?.[opponentId] || {};
  const currentClubName = match.clubs?.[currentClubId]?.details?.name || "Your Team";
  const opponentName = match.clubs?.[opponentId]?.details?.name || "Opponent";

  const renderPlayerTable = (players: any, teamName: string, clubId: string) => {
    let playerList: any[] = Object.values(players);
    if (playerList.length === 0) return null;

    // Sort players by rating (highest first)
    playerList = playerList.sort((a, b) => {
      const aRating = parseFloat(a.rating || "0");
      const bRating = parseFloat(b.rating || "0");
      return bRating - aRating;
    });

    // Calculate team totals
    const teamStats = playerList.reduce((acc, player) => {
      acc.shots += parseInt(player.shots || "0");
      acc.passes += parseInt(player.passesmade || "0");
      acc.tackles += parseInt(player.tacklesmade || "0");
      acc.yellowCards += parseInt(player.yellowcards || "0");
      acc.redCards += parseInt(player.redcards || "0");
      return acc;
    }, { shots: 0, passes: 0, tackles: 0, yellowCards: 0, redCards: 0 });

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-black">{teamName}</h4>
          {/* Team Stats */}
          <div className="text-xs text-gray-600 flex gap-4">
            <span>Shots: <strong>{teamStats.shots}</strong></span>
            <span>Passes: <strong>{teamStats.passes}</strong></span>
            <span>Tackles: <strong>{teamStats.tackles}</strong></span>
            <span>Cards: {teamStats.yellowCards > 0 && <span>🟨{teamStats.yellowCards}</span>} {teamStats.redCards > 0 && <span className="ml-1">🟥{teamStats.redCards}</span>}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="py-2 px-2 font-medium text-black">Player</th>
                <th className="py-2 px-2 font-medium text-black">Pos</th>
                <th className="py-2 px-2 font-medium text-black">Rating</th>
                <th className="py-2 px-2 font-medium text-black">Goals</th>
                <th className="py-2 px-2 font-medium text-black">Assists</th>
                <th className="py-2 px-2 font-medium text-black">Shots</th>
                <th className="py-2 px-2 font-medium text-black">Conv%</th>
                <th className="py-2 px-2 font-medium text-black">Passes</th>
                <th className="py-2 px-2 font-medium text-black">Pass%</th>
                <th className="py-2 px-2 font-medium text-black">Tackles</th>
                <th className="py-2 px-2 font-medium text-black">Saves</th>
                <th className="py-2 px-2 font-medium text-black">Cards</th>
              </tr>
            </thead>
            <tbody>
              {playerList.map((player: any, idx: number) => {
                const isMOM = player.mom === "1";
                const rating = parseFloat(player.rating || "0").toFixed(1);
                const passMade = parseInt(player.passesmade || "0");
                const passAttempts = parseInt(player.passattempts || "0");
                const passSuccess = passAttempts > 0 ? Math.round((passMade / passAttempts) * 100) : 0;
                const tacklesMade = parseInt(player.tacklesmade || "0");
                const shots = parseInt(player.shots || "0");
                const goals = parseInt(player.goals || "0");
                const conversionRate = shots > 0 ? Math.round((goals / shots) * 100) : 0;
                const redCards = parseInt(player.redcards || "0");
                const yellowCards = parseInt(player.yellowcards || "0");

                // Check if goalkeeper (position "0" or "gk")
                const isGoalkeeper = player.pos?.toLowerCase() === "gk" || player.pos === "0";

                return (
                  <tr key={idx} className="border-t">
                    <td className="py-2 px-2">
                      <Link
                        href={`/player/${clubId}/${encodeURIComponent(player.playername || 'Unknown')}?platform=${platform}`}
                        className="text-blue-600 hover:underline"
                      >
                        {player.playername}
                      </Link>
                      {isMOM && <span className="ml-1 text-yellow-500">⭐</span>}
                    </td>
                    <td className="py-2 px-2 text-black capitalize">{player.pos || "-"}</td>
                    <td className="py-2 px-2 text-black font-medium">{rating}</td>
                    <td className="py-2 px-2 text-black">{goals}</td>
                    <td className="py-2 px-2 text-black">{player.assists || "0"}</td>
                    <td className="py-2 px-2 text-black">{shots}</td>
                    <td className="py-2 px-2 text-black">{conversionRate}%</td>
                    <td className="py-2 px-2 text-black">{passMade}/{passAttempts}</td>
                    <td className="py-2 px-2 text-black">{passSuccess}%</td>
                    <td className="py-2 px-2 text-black">{tacklesMade}</td>
                    <td className="py-2 px-2 text-black">{isGoalkeeper ? (player.saves || "0") : "-"}</td>
                    <td className="py-2 px-2 text-black">
                      {yellowCards > 0 && <span className="text-yellow-600">🟨</span>}
                      {redCards > 0 && <span className="text-red-600">🟥</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-4">
      {renderPlayerTable(currentClubPlayers, currentClubName, currentClubId)}
      {renderPlayerTable(opponentPlayers, opponentName, opponentId)}
    </div>
  );
}
