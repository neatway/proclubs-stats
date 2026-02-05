"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { safeJson, normalizeMembers, formatDate, extractClubInfo, parseIntSafe, getClubBadgeUrl, getDivisionBadgeUrl, getDivisionName, capitalizeFirst } from "@/lib/utils";
import { NormalizedMember } from "@/types/ea-api";
import { safeRender } from "@/lib/ea-type-guards";
import { getDiscordAvatarUrl } from "@/lib/auth";
import { fetchEAWithProxy } from "@/lib/ea-proxy";

interface ClaimedPlayerStatus {
  personaId: string | null;
  userId: string;
  playerName: string;
  verifiedAt: string;
  user: {
    discordId: string;
    avatarHash: string | null;
  };
}

export default function ClubPage(): React.JSX.Element {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const clubId = params.clubId as string;
  const platform = searchParams.get("platform") ?? "common-gen5";

  const [clubInfo, setClubInfo] = useState<Record<string, unknown> | null>(null);
  const [clubStats, setClubStats] = useState<Record<string, unknown> | null>(null);
  const [playoffAchievements, setPlayoffAchievements] = useState<Record<string, unknown>[] | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<Record<string, unknown> | null>(null);
  const [members, setMembers] = useState<NormalizedMember[]>([]);
  const [matches, setMatches] = useState<{ league: Record<string, unknown>[]; playoff: Record<string, unknown>[]; friendly: Record<string, unknown>[] }>({
    league: [],
    playoff: [],
    friendly: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"club" | "career">("club");
  const [matchTab, setMatchTab] = useState<"league" | "playoff" | "friendly">("league");
  const [last5Filter, setLast5Filter] = useState<'league' | 'friendly'>('league');
  const [showTopStatsPer90, setShowTopStatsPer90] = useState(false);

  // Claimed players state
  const [claimedPlayers, setClaimedPlayers] = useState<ClaimedPlayerStatus[]>([]);

  // Club voting state
  const [clubVotes, setClubVotes] = useState<{ likesCount: number; dislikesCount: number; userVote: string | null }>({
    likesCount: 0,
    dislikesCount: 0,
    userVote: null,
  });
  const [votingInProgress, setVotingInProgress] = useState(false);

  const fetchClubData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [infoData, statsData, playoffData, membersData, leagueMatches, playoffMatches, friendlyMatches] = await Promise.all([
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/info?platform=${platform}&clubIds=${clubId}`),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/overallStats?platform=${platform}&clubIds=${clubId}`).catch(() => null),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/playoffAchievements?platform=${platform}&clubId=${clubId}`).catch(() => null),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/members/career/stats?platform=${platform}&clubId=${clubId}`).catch(() => null),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/matches?platform=${platform}&clubIds=${clubId}&matchType=leagueMatch`, { timeout: 15000 }).catch(() => []),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/matches?platform=${platform}&clubIds=${clubId}&matchType=playoffMatch`, { timeout: 15000 }).catch(() => []),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/matches?platform=${platform}&clubIds=${clubId}&matchType=friendlyMatch`, { timeout: 15000 }).catch(() => []),
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
              clubLeaderboardData = leaderboardJson.find((c: Record<string, unknown>) => String(c.clubId) === String(clubId));
            } else if (leaderboardJson && typeof leaderboardJson === "object") {
              const values = Object.values(leaderboardJson);
              clubLeaderboardData = values.find((c: unknown) => {
                const club = c as Record<string, unknown>;
                return String(club.clubId) === String(clubId);
              });
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

      const normalizedMembers = normalizeMembers(membersData);
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
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || "Failed to load club data");
    } finally {
      setLoading(false);
    }
  }, [clubId, platform]);

  // Fetch claimed player status
  const fetchClaimedPlayers = useCallback(async (membersList: NormalizedMember[]) => {
    if (membersList.length === 0) return;

    try {
      const playerNames = membersList
        .map(m => m.name)
        .filter(Boolean)
        .join(",");

      if (!playerNames) return;

      const response = await fetch(
        `/api/player/claimed-status?platform=${platform}&playerNames=${encodeURIComponent(playerNames)}`
      );

      if (response.ok) {
        const data = await response.json();
        setClaimedPlayers(data.claimedPlayers || []);
      }
    } catch (error) {
      console.error("Error fetching claimed players:", error);
    }
  }, [platform]);

  // Fetch only members when scope changes (don't refetch everything)
  const fetchMembersOnly = useCallback(async (currentScope: "club" | "career") => {
    try {
      let membersData = await fetchEAWithProxy(`https://proclubs.ea.com/api/fc/members/${currentScope}/stats?platform=${platform}&clubId=${clubId}`).catch(() => null);
      // Fallback to career stats if club scope fails (EA deprecated club endpoint)
      if (!membersData && currentScope === "club") {
        membersData = await fetchEAWithProxy(`https://proclubs.ea.com/api/fc/members/career/stats?platform=${platform}&clubId=${clubId}`).catch(() => null);
      }
      if (!membersData) return;

      const normalizedMembers = normalizeMembers(membersData);
      // Sort members by games played (descending)
      const sortedMembers = normalizedMembers.sort((a, b) => {
        const aGames = parseInt(String(a.gamesPlayed || a.appearances || "0"));
        const bGames = parseInt(String(b.gamesPlayed || b.appearances || "0"));
        return bGames - aGames;
      });

      setMembers(sortedMembers);

      // Fetch claimed players for the new member list
      if (sortedMembers.length > 0) {
        fetchClaimedPlayers(sortedMembers);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, [platform, clubId, fetchClaimedPlayers]);

  // Fetch club votes
  const fetchClubVotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/club/vote?clubId=${clubId}&platform=${platform}`);
      if (response.ok) {
        const data = await response.json();
        setClubVotes(data);
      }
    } catch (error) {
      console.error("Error fetching club votes:", error);
    }
  }, [clubId, platform]);

  // Handle vote action
  const handleVote = async (action: "like" | "dislike") => {
    if (!session?.user) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    if (votingInProgress) return;
    setVotingInProgress(true);

    try {
      const response = await fetch("/api/club/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, platform, action }),
      });

      if (response.ok) {
        // Refresh vote counts
        await fetchClubVotes();
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVotingInProgress(false);
    }
  };

  useEffect(() => {
    if (!clubId) return;
    fetchClubData();
  }, [clubId, fetchClubData]);

  // Fetch votes when clubId changes
  useEffect(() => {
    if (!clubId) return;
    fetchClubVotes();
  }, [clubId, fetchClubVotes]);

  // Fetch only members when scope changes (without refetching everything)
  useEffect(() => {
    if (!clubId || !members.length) return; // Skip on initial load (handled by fetchClubData)
    fetchMembersOnly(scope);
  }, [scope, fetchMembersOnly, clubId]); // Note: deliberately NOT including members to avoid infinite loop

  // Fetch claimed status when members change
  useEffect(() => {
    if (members.length > 0) {
      fetchClaimedPlayers(members);
    }
  }, [members, fetchClaimedPlayers]);

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
  const clubBadgeUrl: string = useMemo(() => getClubBadgeUrl(clubInfo), [clubInfo]);

  // Calculate form (last 5 games) from all matches
  const clubForm = useMemo((): string[] => {
    const allMatches = [...matches.league, ...matches.playoff, ...matches.friendly];
    if (allMatches.length === 0) return [];

    // Sort by timestamp (newest first) and take last 5
    const sortedMatches = allMatches
      .filter(m => m.timestamp)
      .sort((a, b) => {
        const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
        const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    const results: string[] = [];
    for (const match of sortedMatches) {
      const clubs = (match.clubs as Record<string, Record<string, unknown>>) || {};
      const currentClub = clubs[clubId];
      if (!currentClub) continue;

      // Determine W/D/L
      let result: string | null = null;

      // Always check goals first to handle quit games (3-0) correctly
      const goalsFor = parseInt(String(currentClub.goals || "0"));
      const goalsAgainst = parseInt(String(currentClub.goalsAgainst || "0"));

      if (goalsFor > goalsAgainst) {
        result = "W";
      } else if (goalsFor < goalsAgainst) {
        result = "L";
      } else if (goalsFor === goalsAgainst) {
        // Only if goals are equal, check EA's result field as fallback
        if (currentClub.matchType === "5") {
          result = "D";
        } else {
          // League/playoff match - verify with result field
          if (currentClub.result === "1") result = "W";
          else if (currentClub.result === "2") result = "L";
          else if (currentClub.result === "0") result = "D";
          else if (currentClub.wins === "1") result = "W";
          else if (currentClub.losses === "1") result = "L";
          else if (currentClub.ties === "1") result = "D";
          else result = "D"; // Default to draw if goals are equal and no result field
        }
      }

      if (result) results.push(result);
    }

    return results.reverse(); // Reverse to show oldest to newest (left to right)
  }, [matches, clubId]);

  // Get last match for showcase
  const lastMatch = useMemo(() => {
    const allMatches = [...matches.league, ...matches.playoff, ...matches.friendly];
    if (allMatches.length === 0) return null;

    // Sort by timestamp (newest first) and get the first one
    const sortedMatches = allMatches
      .filter(m => m.timestamp)
      .sort((a, b) => {
        const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
        const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
        return bTime - aTime;
      });

    if (sortedMatches.length === 0) return null;

    const match = sortedMatches[0];
    const clubs = (match.clubs as Record<string, Record<string, unknown>>) || {};
    const clubIds = Object.keys(clubs);
    const currentClub = clubs[clubId];
    const opponentId = clubIds.find((id) => id !== clubId);
    const opponent = opponentId ? clubs[opponentId] : null;

    if (!currentClub || !opponent) return null;

    // Determine result - always check goals first to handle quit games (3-0) correctly
    let result = "?";

    const goalsFor = parseInt(String(currentClub.goals || "0"));
    const goalsAgainst = parseInt(String(currentClub.goalsAgainst || "0"));

    if (goalsFor > goalsAgainst) {
      result = "W";
    } else if (goalsFor < goalsAgainst) {
      result = "L";
    } else if (goalsFor === goalsAgainst) {
      // Only if goals are equal, check EA's result field as fallback
      if (currentClub.matchType === "5") {
        result = "D";
      } else {
        // League/playoff match - verify with result field
        if (currentClub.result === "1") result = "W";
        else if (currentClub.result === "2") result = "L";
        else if (currentClub.result === "0") result = "D";
        else if (currentClub.wins === "1") result = "W";
        else if (currentClub.losses === "1") result = "L";
        else if (currentClub.ties === "1") result = "D";
        else result = "D"; // Default to draw if goals are equal and no result field
      }
    }

    // Find top scorer and MOTM from match players
    const matchPlayers = match.players as Record<string, Record<string, unknown>> | undefined;
    const players = matchPlayers?.[clubId] || {};
    const playerList: Record<string, unknown>[] = Object.values(players) as Record<string, unknown>[];

    const topScorer = playerList.length > 0 ? playerList.reduce((prev, curr) => {
      const prevGoals = parseInt(String(prev?.goals || "0"));
      const currGoals = parseInt(String(curr?.goals || "0"));
      return currGoals > prevGoals ? curr : prev;
    }, playerList[0]) : null;

    const motm = playerList.find((p: Record<string, unknown>) => p.mom === "1");

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

  // Helper functions for claim functionality
  const isPlayerClaimed = (playerName: string): boolean => {
    return claimedPlayers.some(cp => cp.playerName === playerName);
  };

  const getPlayerAvatar = (playerName: string): string => {
    const claimedPlayer = claimedPlayers.find(cp => cp.playerName === playerName);
    if (claimedPlayer) {
      return getDiscordAvatarUrl(claimedPlayer.user.discordId, claimedPlayer.user.avatarHash, 128);
    }
    // Return placeholder avatar if not claimed
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=128&background=667eea&color=fff&bold=true`;
  };


  if (loading) {
    return (
      <main style={{ minHeight: '100vh', paddingTop: '64px', paddingLeft: 'var(--space-xl)', paddingRight: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
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
      <main style={{ minHeight: '100vh', paddingTop: '64px', paddingLeft: 'var(--space-xl)', paddingRight: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            color: 'var(--danger)',
            marginBottom: '16px'
          }}>
            {error}
          </div>
          <Link href="/" className="btn btn-secondary">
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  return (
      <main style={{ minHeight: '100vh', padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0' }}>
          {/* Breadcrumb navigation - OUTSIDE blue container */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#9CA3AF',
            marginTop: '0px',
            marginBottom: '16px',
            fontFamily: 'Work Sans, sans-serif'
          }}>
            <Link
              href="/"
              style={{
                color: '#9CA3AF',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
            >
              Home
            </Link>

            <span style={{ color: '#6B7280' }}>/</span>

            <span style={{ color: '#FFFFFF', fontWeight: 500 }}>
              {String(clubInfo?.name || "Club")}
            </span>
          </div>

          {/* All sections container - BLUE border with 24px gaps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* CLUB INFO HEADER - Exact match to reference */}
          <div className="club-info-header" style={{
            background: '#1D1D1D',
            padding: '16px 24px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 3vw, 40px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Club Badge - Left */}
            <img
              src={clubBadgeUrl}
              alt={typeof clubInfo?.name === 'string' ? clubInfo.name : "Club Badge"}
              className="club-badge"
              style={{
                width: '180px',
                height: '180px',
                border: 'none',
                borderRadius: '12px',
                objectFit: 'cover',
                flexShrink: 0,
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))'
              }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
              }}
            />

            {/* Club Name & Record - Center */}
            <div className="club-name-section" style={{ flex: 1 }}>
              <h1 className="club-name" style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 'clamp(48px, 7vw, 80px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                margin: '0 0 12px 0',
                lineHeight: 1,
                color: '#FFFFFF',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
              }}>
                {String(clubInfo?.name || "Club Profile")}
              </h1>

              {/* Desktop W/D/L - hidden on mobile */}
              <p className="club-record club-record-desktop" style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontWeight: 400,
                color: '#CACFD6',
                margin: 0,
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                wordSpacing: '-0.15em'
              }}>
                W <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{stats.wins}</span> D <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{stats.draws}</span> L <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{stats.losses}</span>
              </p>

              {/* Mobile Skill Rating - shown on mobile only */}
              <div className="club-skill-mobile" style={{ display: 'none' }}>
                <div style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#9CA3AF',
                  marginBottom: '4px',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  SKILL RATING
                </div>
                <div style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '48px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1,
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                }}>
                  {parseIntSafe(leaderboardData?.skillRating || clubStats?.skillRating || clubStats?.skillrating) || '—'}
                </div>
              </div>

              {/* Mobile W/D/L - shown on mobile only, in column 2 */}
              <p className="club-record-mobile" style={{
                display: 'none',
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: '24px',
                fontWeight: 600,
                color: '#CACFD6',
                margin: 0,
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                wordSpacing: '-0.15em',
                textAlign: 'center',
                width: '100%',
                letterSpacing: '2px'
              }}>
                <span style={{ fontSize: '24px' }}>W</span><span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '24px' }}>{stats.wins}</span> <span style={{ fontSize: '24px' }}>D</span><span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '24px' }}>{stats.draws}</span> <span style={{ fontSize: '24px' }}>L</span><span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '24px' }}>{stats.losses}</span>
              </p>
            </div>

            {/* Skill Rating & Likes - Right (desktop) / Right side (mobile) */}
            <div className="club-stats-right" style={{
              display: 'flex',
              gap: 'clamp(16px, 3vw, 40px)',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              alignSelf: 'center'
            }}>
              {/* Skill Rating - Desktop only */}
              <div className="club-skill-desktop" style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 'clamp(10px, 1.5vw, 14px)',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#9CA3AF',
                  marginBottom: '4px',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  SKILL RATING
                </div>
                <div style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1,
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                }}>
                  {parseIntSafe(leaderboardData?.skillRating || clubStats?.skillRating || clubStats?.skillrating) || '—'}
                </div>
              </div>

              {/* Likes/Dislikes */}
              <div className="club-likes" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(8px, 1.5vw, 16px)',
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 'clamp(20px, 3vw, 42px)',
                fontWeight: 600
              }}>
                <button
                  onClick={() => handleVote("like")}
                  disabled={votingInProgress}
                  style={{
                    background: clubVotes.userVote === 'like' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    border: clubVotes.userVote === 'like' ? '2px solid #10B981' : '2px solid transparent',
                    borderRadius: '8px',
                    padding: 'clamp(4px, 0.8vw, 8px) clamp(8px, 1.2vw, 16px)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1vw, 8px)',
                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                    cursor: votingInProgress ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit'
                  }}
                  title={session?.user ? "Like this club" : "Login to vote"}
                >
                  <span style={{ fontSize: 'clamp(18px, 2.5vw, 36px)' }}>👍</span> {clubVotes.likesCount}
                </button>
                <button
                  onClick={() => handleVote("dislike")}
                  disabled={votingInProgress}
                  style={{
                    background: clubVotes.userVote === 'dislike' ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                    border: clubVotes.userVote === 'dislike' ? '2px solid #DC2626' : '2px solid transparent',
                    borderRadius: '8px',
                    padding: 'clamp(4px, 0.8vw, 8px) clamp(8px, 1.2vw, 16px)',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1vw, 8px)',
                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                    cursor: votingInProgress ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit'
                  }}
                  title={session?.user ? "Dislike this club" : "Login to vote"}
                >
                  <span style={{ fontSize: 'clamp(18px, 2.5vw, 36px)' }}>👎</span> {clubVotes.dislikesCount}
                </button>
              </div>
            </div>
          </div>

          {/* 3-CARD STATS ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {/* Card 1: Team Form */}
            <div className="team-form-card" style={{
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#FFFFFF',
                marginBottom: '10px',
                fontFamily: 'Montserrat, sans-serif',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
              }}>Team form</h3>

              <div className="team-form-container" style={{
                display: 'flex',
                gap: '8px',
                flex: 1,
                alignItems: 'center'
              }}>
                {clubForm.slice(0, 5).map((result, idx) => {
                  const allMatches = [...matches.league, ...matches.playoff, ...matches.friendly];
                  const sortedMatches = allMatches
                    .filter(m => m.timestamp)
                    .sort((a, b) => {
                      const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
                      const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
                      return bTime - aTime;
                    })
                    .slice(0, 5)
                    .reverse();

                  const match = sortedMatches[idx];
                  const clubs = match?.clubs as Record<string, Record<string, unknown>> || {};
                  const currentClub = clubs[clubId];
                  const opponentId = Object.keys(clubs).find(id => id !== clubId);
                  const opponent = opponentId ? clubs[opponentId] : null;

                  const score = currentClub && opponent
                    ? `${currentClub.goals || 0}-${opponent.goals || 0}`
                    : '0-0';

                  const opponentBadge = opponent?.details
                    ? getClubBadgeUrl(opponent.details)
                    : "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";

                  const bgColor = result === "W" ? "#22C55E" : result === "D" ? "#6B7280" : "#DC2626";

                  return (
                    <div key={idx} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        background: bgColor,
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: 'IBM Plex Mono, monospace',
                        textAlign: 'center',
                        letterSpacing: '-0.5px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
                      }}>{score}</div>

                      <img
                        src={opponentBadge}
                        alt="Opponent"
                        onClick={() => opponentId && router.push(`/club/${opponentId}?platform=${platform}`)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '4px',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        onError={(e) => {
                          e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Divisions - SIDE BY SIDE */}
            <div className="divisions-card" style={{
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 500,
                color: '#FFFFFF',
                marginBottom: '12px',
                fontFamily: 'Montserrat, sans-serif',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
              }}>Divisions</h3>

              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1
              }}>
                {/* Current Division */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div className="division-label">Current</div>
                  {(() => {
                    // Check multiple sources for current division
                    const currentDiv = leaderboardData?.currentDivision || clubStats?.divisionNumber || clubInfo?.divisionNumber;
                    if (!currentDiv) return <div style={{ fontSize: '24px', color: '#9CA3AF' }}>—</div>;

                    const badgeUrl = getDivisionBadgeUrl(currentDiv as string | number);
                    if (badgeUrl) {
                      return (
                        <img
                          className="division-badge"
                          src={badgeUrl}
                          alt={`Division ${String(currentDiv)}`}
                        />
                      );
                    }
                    return (
                      <div style={{
                        fontSize: '56px',
                        fontWeight: 700,
                        color: '#FFFFFF'
                      }}>
                        {String(currentDiv)}
                      </div>
                    );
                  })()}
                </div>

                {/* Divider Line */}
                <div className="division-divider" />

                {/* Best Division */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div className="division-label">Best</div>
                  {(clubStats?.bestDivision || leaderboardData?.bestDivision) ? (
                    getDivisionBadgeUrl((clubStats?.bestDivision || leaderboardData?.bestDivision) as string | number) ? (
                      <img
                        className="division-badge"
                        src={getDivisionBadgeUrl((clubStats?.bestDivision || leaderboardData?.bestDivision) as string | number) || ""}
                        alt={`Division ${String(clubStats?.bestDivision || leaderboardData?.bestDivision)}`}
                      />
                    ) : (
                      <div style={{
                        fontSize: '56px',
                        fontWeight: 700,
                        color: '#FFFFFF'
                      }}>
                        {String(clubStats?.bestDivision || leaderboardData?.bestDivision)}
                      </div>
                    )
                  ) : (
                    <div style={{ fontSize: '24px', color: '#9CA3AF' }}>—</div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Last Game */}
            <div style={{
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 500,
                color: '#FFFFFF',
                marginBottom: '12px',
                fontFamily: 'Montserrat, sans-serif',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
              }}>Last Game</h3>

              {lastMatch ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(2px, 1vw, 4px)',
                  minHeight: '140px',
                  paddingTop: 'clamp(8px, 2vw, 12px)',
                  paddingBottom: 'clamp(8px, 2vw, 12px)'
                }}>
                  {/* Badges and Score */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(20px, 5vw, 36px)'
                  }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img
                        src={clubBadgeUrl}
                        alt="Club"
                        onClick={() => router.push(`/club/${clubId}?platform=${platform}`)}
                        style={{
                          width: 'clamp(65px, 12vw, 81px)',
                          height: 'clamp(65px, 12vw, 81px)',
                          objectFit: 'contain',
                          marginBottom: 'clamp(4px, 1vw, 6px)',
                          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      />
                      <div style={{
                        fontSize: 'clamp(12px, 3vw, 16px)',
                        color: '#FFFFFF',
                        fontFamily: 'Work Sans, sans-serif',
                        fontWeight: 600,
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
                        maxWidth: '15ch',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        width: '100%'
                      }}>
                        {String(clubInfo?.name || "")}
                      </div>
                    </div>

                    <div style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: 'clamp(28px, 8vw, 38px)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: '-2px',
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                    }}>
                      {String(lastMatch.currentClub.goals || 0)} - {String(lastMatch.opponent.goals || 0)}
                    </div>

                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img
                        src={getClubBadgeUrl(lastMatch.opponent.details)}
                        alt="Opponent"
                        onClick={() => lastMatch.opponentId && router.push(`/club/${lastMatch.opponentId}?platform=${platform}`)}
                        style={{
                          width: 'clamp(65px, 12vw, 81px)',
                          height: 'clamp(65px, 12vw, 81px)',
                          objectFit: 'contain',
                          marginBottom: 'clamp(4px, 1vw, 6px)',
                          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        onError={(e) => {
                          e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
                        }}
                      />
                      <div style={{
                        fontSize: 'clamp(12px, 3vw, 16px)',
                        color: '#FFFFFF',
                        fontFamily: 'Work Sans, sans-serif',
                        fontWeight: 600,
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
                        maxWidth: '15ch',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        width: '100%'
                      }}>
                        {String((lastMatch.opponent.details as Record<string, unknown> | undefined)?.name || "Unknown")}
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{
                    fontSize: 'clamp(12px, 3vw, 15px)',
                    color: '#FFFFFF',
                    fontFamily: 'Work Sans, sans-serif',
                    marginTop: 'clamp(2px, 1vw, 4px)',
                    fontWeight: 500,
                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
                  }}>
                    {formatDate(lastMatch.match.timestamp as number | string | undefined)}
                  </div>

                  {/* MOTM */}
                  {Boolean(lastMatch.motm?.playername) && (
                    <div style={{
                      fontSize: 'clamp(11px, 2.5vw, 14px)',
                      color: '#C9A84C',
                      fontFamily: 'Work Sans, sans-serif',
                      fontWeight: 500,
                      marginTop: '2px',
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
                    }}>
                      MOTM: {String(lastMatch.motm?.playername)}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  fontSize: '14px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  padding: '40px 0'
                }}>
                  No recent matches
                </div>
              )}
            </div>
          </div>

          {/* PLAYER STATS SECTION - Same 3-column grid as cards above */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px'
          }}>
            {/* LEFT: Top Rated, Top Scorers, Top Assists - Takes 2 columns on desktop */}
            <div className="top-sections-container" style={{
              gridColumn: 'span 2',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Toggle Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center'
              }}>
                <div className="top-stats-toggle" style={{
                  display: 'flex',
                  background: '#2A2A2A',
                  borderRadius: '8px',
                  padding: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <button
                    onClick={() => setShowTopStatsPer90(false)}
                    className="top-stats-toggle-btn"
                    style={{
                      background: !showTopStatsPer90 ? '#C9A84C' : 'transparent',
                      color: !showTopStatsPer90 ? '#0A0A0A' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'Work Sans, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Total
                  </button>
                  <button
                    onClick={() => setShowTopStatsPer90(true)}
                    className="top-stats-toggle-btn"
                    style={{
                      background: showTopStatsPer90 ? '#C9A84C' : 'transparent',
                      color: showTopStatsPer90 ? '#0A0A0A' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'Work Sans, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Per 90
                  </button>
                </div>
              </div>

              {/* Three columns grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '20px'
              }}>
              {/* Top Rated */}
              <div className="top-section-item">
                <h3 className="top-section-header" style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  marginBottom: '12px',
                  fontFamily: 'Montserrat, sans-serif',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                }}>Top rated</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {members
                    .slice()
                    .sort((a, b) => {
                      const aRating = typeof a.ratingAve === 'number' ? a.ratingAve : parseFloat(String(a.ratingAve || 0));
                      const bRating = typeof b.ratingAve === 'number' ? b.ratingAve : parseFloat(String(b.ratingAve || 0));
                      return bRating - aRating;
                    })
                    .slice(0, 3)
                    .map((member, idx) => {
                      const rating = typeof member.ratingAve === 'number'
                        ? member.ratingAve.toFixed(2)
                        : parseFloat(String(member.ratingAve || 0)).toFixed(2);

                      return (
                        <div key={member.personaId || idx}>
                          <div
                            onClick={() => router.push(`/player/${clubId}/${encodeURIComponent(member.name)}?platform=${platform}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              padding: '10px 4px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ position: 'relative' }}>
                              <img
                                src={getPlayerAvatar(member.name)}
                                alt={member.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                                }}
                              />
                              {isPlayerClaimed(member.name) && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-2px',
                                  right: '-2px',
                                  background: '#10B981',
                                  borderRadius: '50%',
                                  width: '16px',
                                  height: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px solid #1D1D1D',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  color: '#FFFFFF'
                                }}>
                                  ✓
                                </div>
                              )}
                            </div>
                            <div className="top-section-player-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                              <div className="top-section-player-name-text" style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#FFFFFF',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                justifyContent: 'flex-start'
                              }}>
                                {member.name}
                                {Boolean(member.proNationality) && (
                                  <img
                                    src={`https://media.contentapi.ea.com/content/dam/ea/fifa/fifa-21/ratings-collective/f20assets/country-flags/${member.proNationality}.png`}
                                    alt="Flag"
                                    style={{
                                      width: '16px',
                                      height: '11px',
                                      objectFit: 'cover',
                                      borderRadius: '2px',
                                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                                    }}
                                  />
                                )}
                              </div>
                              <div className="top-section-club-name" style={{
                                fontSize: '11px',
                                color: '#9CA3AF',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                textAlign: 'left'
                              }}>
                                {String(clubInfo?.name || 'Club')}
                              </div>
                            </div>
                            {idx === 0 && (
                              <div style={{
                                background: '#0EA5E9',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(14, 165, 233, 0.4)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                              }}>
                                {rating}
                              </div>
                            )}
                            {idx !== 0 && (
                              <div style={{
                                padding: '4px 8px',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                flexShrink: 0,
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                              }}>
                                {rating}
                              </div>
                            )}
                          </div>
                          {idx < 2 && (
                            <div style={{
                              width: '100%',
                              height: '1px',
                              background: 'rgba(255, 255, 255, 0.2)',
                              margin: '8px 0'
                            }} />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Top Scorers */}
              <div className="top-section-item">
                <h3 className="top-section-header" style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  marginBottom: '12px',
                  fontFamily: 'Montserrat, sans-serif',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                }}>Top scorers</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {members
                    .slice()
                    .sort((a, b) => {
                      const aGoals = parseInt(String(a.goals || 0));
                      const bGoals = parseInt(String(b.goals || 0));
                      const aGames = parseInt(String(a.gamesPlayed || 1));
                      const bGames = parseInt(String(b.gamesPlayed || 1));

                      if (showTopStatsPer90) {
                        return (bGoals / bGames) - (aGoals / aGames);
                      }
                      return bGoals - aGoals;
                    })
                    .slice(0, 3)
                    .map((member, idx) => {
                      const goals = parseInt(String(member.goals || 0));
                      const games = parseInt(String(member.gamesPlayed || 1));
                      const goalsPerGame = games > 0 ? (goals / games).toFixed(2) : "0.00";
                      const displayValue = showTopStatsPer90 ? goalsPerGame : goals;

                      return (
                        <div key={member.personaId || idx}>
                          <div
                            onClick={() => router.push(`/player/${clubId}/${encodeURIComponent(member.name)}?platform=${platform}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              padding: '10px 4px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ position: 'relative' }}>
                              <img
                                src={getPlayerAvatar(member.name)}
                                alt={member.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                                }}
                              />
                              {isPlayerClaimed(member.name) && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-2px',
                                  right: '-2px',
                                  background: '#10B981',
                                  borderRadius: '50%',
                                  width: '16px',
                                  height: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px solid #1D1D1D',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  color: '#FFFFFF'
                                }}>
                                  ✓
                                </div>
                              )}
                            </div>
                            <div className="top-section-player-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                              <div className="top-section-player-name-text" style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#FFFFFF',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                justifyContent: 'flex-start'
                              }}>
                                {member.name}
                                {Boolean(member.proNationality) && (
                                  <img
                                    src={`https://media.contentapi.ea.com/content/dam/ea/fifa/fifa-21/ratings-collective/f20assets/country-flags/${member.proNationality}.png`}
                                    alt="Flag"
                                    style={{
                                      width: '16px',
                                      height: '11px',
                                      objectFit: 'cover',
                                      borderRadius: '2px',
                                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                                    }}
                                  />
                                )}
                              </div>
                              <div className="top-section-club-name" style={{
                                fontSize: '11px',
                                color: '#9CA3AF',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                textAlign: 'left'
                              }}>
                                {String(clubInfo?.name || 'Club')}
                              </div>
                            </div>
                            {idx === 0 && (
                              <div style={{
                                background: '#0EA5E9',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '17px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(14, 165, 233, 0.4)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                              }}>
                                {displayValue}
                              </div>
                            )}
                            {idx !== 0 && (
                              <div style={{
                                padding: '6px 12px',
                                fontSize: '17px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                flexShrink: 0,
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                              }}>
                                {displayValue}
                              </div>
                            )}
                          </div>
                          {idx < 2 && (
                            <div style={{
                              width: '100%',
                              height: '1px',
                              background: 'rgba(255, 255, 255, 0.2)',
                              margin: '8px 0'
                            }} />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Top Assists */}
              <div className="top-section-item">
                <h3 className="top-section-header" style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  marginBottom: '12px',
                  fontFamily: 'Montserrat, sans-serif',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                }}>Top assists</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {members
                    .slice()
                    .sort((a, b) => {
                      const aAssists = parseInt(String(a.assists || 0));
                      const bAssists = parseInt(String(b.assists || 0));
                      const aGames = parseInt(String(a.gamesPlayed || 1));
                      const bGames = parseInt(String(b.gamesPlayed || 1));

                      if (showTopStatsPer90) {
                        return (bAssists / bGames) - (aAssists / aGames);
                      }
                      return bAssists - aAssists;
                    })
                    .slice(0, 3)
                    .map((member, idx) => {
                      const assists = parseInt(String(member.assists || 0));
                      const games = parseInt(String(member.gamesPlayed || 1));
                      const assistsPerGame = games > 0 ? (assists / games).toFixed(2) : "0.00";
                      const displayValue = showTopStatsPer90 ? assistsPerGame : assists;

                      return (
                        <div key={member.personaId || idx}>
                          <div
                            onClick={() => router.push(`/player/${clubId}/${encodeURIComponent(member.name)}?platform=${platform}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              padding: '10px 4px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ position: 'relative' }}>
                              <img
                                src={getPlayerAvatar(member.name)}
                                alt={member.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                                }}
                              />
                              {isPlayerClaimed(member.name) && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-2px',
                                  right: '-2px',
                                  background: '#10B981',
                                  borderRadius: '50%',
                                  width: '16px',
                                  height: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px solid #1D1D1D',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  color: '#FFFFFF'
                                }}>
                                  ✓
                                </div>
                              )}
                            </div>
                            <div className="top-section-player-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                              <div className="top-section-player-name-text" style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#FFFFFF',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                justifyContent: 'flex-start'
                              }}>
                                {member.name}
                                {Boolean(member.proNationality) && (
                                  <img
                                    src={`https://media.contentapi.ea.com/content/dam/ea/fifa/fifa-21/ratings-collective/f20assets/country-flags/${member.proNationality}.png`}
                                    alt="Flag"
                                    style={{
                                      width: '16px',
                                      height: '11px',
                                      objectFit: 'cover',
                                      borderRadius: '2px',
                                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                                    }}
                                  />
                                )}
                              </div>
                              <div className="top-section-club-name" style={{
                                fontSize: '11px',
                                color: '#9CA3AF',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                textAlign: 'left'
                              }}>
                                {String(clubInfo?.name || 'Club')}
                              </div>
                            </div>
                            {idx === 0 && (
                              <div style={{
                                background: '#0EA5E9',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '17px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(14, 165, 233, 0.4)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                              }}>
                                {displayValue}
                              </div>
                            )}
                            {idx !== 0 && (
                              <div style={{
                                padding: '6px 12px',
                                fontSize: '17px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                flexShrink: 0,
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                              }}>
                                {displayValue}
                              </div>
                            )}
                          </div>
                          {idx < 2 && (
                            <div style={{
                              width: '100%',
                              height: '1px',
                              background: 'rgba(255, 255, 255, 0.2)',
                              margin: '8px 0'
                            }} />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
              </div>
            </div>

            {/* RIGHT: Team Record Section - Takes 1 column (same width as Team Form/Divisions/Last Game) */}
            <div className="team-record-container" style={{
              gridColumn: 'span 1',
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}>
              {/* Badge and Skill Rating */}
              <div className="team-record-badge-section">
                {/* Club Badge with W/D/L Circle Progress */}
                <div style={{
                  position: 'relative',
                  width: '140px',
                  height: '140px'
                }}>
                  {/* SVG Circle Progress */}
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 140 140"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: 'rotate(-90deg)',
                      filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.3))'
                    }}
                  >
                    {/* Background circle */}
                    <circle
                      cx="70"
                      cy="70"
                      r="65"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="8"
                    />
                    {/* Win percentage (green) */}
                    <circle
                      cx="70"
                      cy="70"
                      r="65"
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="8"
                      strokeDasharray={`${(parseFloat(stats.winPercent) / 100) * (2 * Math.PI * 65)} ${2 * Math.PI * 65}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Draw percentage (gray) */}
                    <circle
                      cx="70"
                      cy="70"
                      r="65"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="8"
                      strokeDasharray={`${(parseFloat(stats.drawPercent) / 100) * (2 * Math.PI * 65)} ${2 * Math.PI * 65}`}
                      strokeDashoffset={`-${(parseFloat(stats.winPercent) / 100) * (2 * Math.PI * 65)}`}
                      strokeLinecap="round"
                    />
                    {/* Loss percentage (red) */}
                    <circle
                      cx="70"
                      cy="70"
                      r="65"
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="8"
                      strokeDasharray={`${(parseFloat(stats.lossPercent) / 100) * (2 * Math.PI * 65)} ${2 * Math.PI * 65}`}
                      strokeDashoffset={`-${((parseFloat(stats.winPercent) + parseFloat(stats.drawPercent)) / 100) * (2 * Math.PI * 65)}`}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Badge in center */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100px',
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={clubBadgeUrl}
                      alt="Club Badge"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))'
                      }}
                    />
                  </div>
                </div>

                {/* Skill Rating */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#9CA3AF',
                    fontFamily: 'Montserrat, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px',
                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
                  }}>Skill Rating</div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: 'IBM Plex Mono, monospace',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    lineHeight: 1
                  }}>{parseIntSafe(leaderboardData?.skillRating || clubStats?.skillRating || clubStats?.skillrating) || '—'}</div>
                </div>

                {/* Record */}
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <div style={{
                    fontSize: 'clamp(10px, 2vw, 11px)',
                    fontWeight: 700,
                    color: '#9CA3AF',
                    fontFamily: 'Montserrat, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px',
                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
                  }}>Record</div>
                  <div style={{
                    fontSize: 'clamp(18px, 4vw, 24px)',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: 'IBM Plex Mono, monospace',
                    letterSpacing: '-1px',
                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                    lineHeight: 1
                  }}>
                    {stats.wins}-{stats.draws}-{stats.losses}
                  </div>
                </div>
              </div>

              {/* Stats, W/D/L, Record */}
              <div className="team-record-stats-section">
                {/* STATS Heading */}
                <h3 style={{
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                  margin: 0,
                  textAlign: 'center'
                }}>STATS</h3>

                {/* Stats List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{
                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                    color: '#FFFFFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    lineHeight: 1.4,
                    textAlign: 'center'
                  }}>
                    Matches Played: <span style={{ fontWeight: 700 }}>{stats.totalMatches}</span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                    color: '#FFFFFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    lineHeight: 1.4,
                    textAlign: 'center'
                  }}>
                    League Appearances: <span style={{ fontWeight: 700 }}>{parseIntSafe(clubStats?.leagueAppearances || clubStats?.leagueApps)}</span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                    color: '#FFFFFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    lineHeight: 1.4,
                    textAlign: 'center'
                  }}>
                    Playoff Appearances: <span style={{ fontWeight: 700 }}>{parseIntSafe(clubStats?.gamesPlayedPlayoff || clubStats?.playoffApps)}</span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                    color: '#FFFFFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    lineHeight: 1.4,
                    textAlign: 'center'
                  }}>
                    Goals Scored: <span style={{ fontWeight: 700 }}>{stats.goalsScored}</span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                    color: '#FFFFFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    lineHeight: 1.4,
                    textAlign: 'center'
                  }}>
                    Goals Conceded: <span style={{ fontWeight: 700 }}>{stats.goalsConceded}</span>
                  </div>
                </div>

                {/* W/D/L Badges */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  {/* Win */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      background: '#22C55E',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 6px rgba(34, 197, 94, 0.4)'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: 'Montserrat, sans-serif',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                        lineHeight: 1,
                        letterSpacing: '0.5px'
                      }}>W</div>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontFamily: 'IBM Plex Mono, monospace',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                      lineHeight: 1
                    }}>{stats.winPercent}%</div>
                  </div>

                  {/* Draw */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      background: '#6B7280',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 6px rgba(107, 114, 128, 0.4)'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: 'Montserrat, sans-serif',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                        lineHeight: 1,
                        letterSpacing: '0.5px'
                      }}>D</div>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontFamily: 'IBM Plex Mono, monospace',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                      lineHeight: 1
                    }}>{stats.drawPercent}%</div>
                  </div>

                  {/* Loss */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      background: '#DC2626',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: 'Montserrat, sans-serif',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                        lineHeight: 1,
                        letterSpacing: '0.5px'
                      }}>L</div>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontFamily: 'IBM Plex Mono, monospace',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                      lineHeight: 1
                    }}>{stats.lossPercent}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Squad List and Last 5 Matches - Two Column Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            alignItems: 'start'
          }}>
            {/* Squad List */}
            <div style={{
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                  margin: 0
                }}>SQUAD LIST</h2>
                <select
                  style={{
                    background: '#2A2A2A',
                    border: '1px solid #3F3F3F',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  value={scope}
                  onChange={(e) => setScope(e.target.value as "club" | "career")}
                >
                  <option value="club">Club Stats</option>
                  <option value="career">Career Stats</option>
                </select>
              </div>

              {/* Player List */}
              {members.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {members.map((member, idx) => {
                    // Get nationality number for EA flag
                    const nationality = member.proNationality || '';

                    return (
                      <div
                        key={member.personaId || idx}
                        className="squad-player-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '16px 0',
                          borderBottom: idx < members.length - 1 ? '1px solid #2A2A2A' : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                        onClick={() => {
                          router.push(
                            `/player/${clubId}/${encodeURIComponent(member.name)}?platform=${platform}`
                          );
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Row 1: Avatar + Name (Mobile) / Desktop: Avatar */}
                        <div className="squad-player-avatar" style={{ position: 'relative', marginRight: '12px' }}>
                          <img
                            src={getPlayerAvatar(member.name)}
                            alt={member.name}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                            }}
                          />
                          {isPlayerClaimed(member.name) && (
                            <div style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              background: '#10B981',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #1D1D1D',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#FFFFFF'
                            }}>
                              ✓
                            </div>
                          )}
                        </div>

                        {/* Row 1: Player Name (Mobile shows with avatar) / Desktop: Name + Position */}
                        <div className="squad-player-info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="squad-player-name" style={{
                            fontSize: getPlayerNameFontSize(member.name),
                            fontWeight: 600,
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat, sans-serif',
                            marginBottom: '4px',
                            textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {member.name}
                          </div>
                          {/* Row 2: Position (Mobile) / Desktop: inline with name */}
                          <div className="squad-player-position" style={{
                            fontSize: '11px',
                            color: '#9CA3AF',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {nationality && (
                              <img
                                src={`https://media.contentapi.ea.com/content/dam/ea/fifa/fifa-21/ratings-collective/f20assets/country-flags/${nationality}.png`}
                                alt="Flag"
                                style={{
                                  width: '16px',
                                  height: '11px',
                                  objectFit: 'cover',
                                  borderRadius: '2px',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            {capitalizeFirst(String(safeRender(member.pos || member.proPos))) || '—'}
                          </div>
                        </div>

                        {/* Row 3: Stats */}
                        <div className="squad-player-stats" style={{
                          display: 'flex',
                          gap: '20px',
                          alignItems: 'center'
                        }}>

                          {/* Overall */}
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              fontFamily: 'Montserrat, sans-serif',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              marginBottom: '2px',
                              letterSpacing: '0.5px'
                            }}>OVR</div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#22C55E',
                              fontFamily: 'IBM Plex Mono, monospace',
                              textShadow: '0 1px 3px rgba(34, 197, 94, 0.4)'
                            }}>
                              {safeRender(member.proOverall)}
                            </div>
                          </div>

                          {/* Apps */}
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              fontFamily: 'Montserrat, sans-serif',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              marginBottom: '2px',
                              letterSpacing: '0.5px'
                            }}>APPS</div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#FFFFFF',
                              fontFamily: 'IBM Plex Mono, monospace',
                              textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
                            }}>
                              {safeRender(member.gamesPlayed || member.appearances)}
                            </div>
                          </div>

                          {/* Win% */}
                          <div style={{ textAlign: 'center', minWidth: '50px' }}>
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              fontFamily: 'Montserrat, sans-serif',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              marginBottom: '2px',
                              letterSpacing: '0.5px'
                            }}>WIN%</div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#FFFFFF',
                              fontFamily: 'IBM Plex Mono, monospace',
                              textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
                            }}>
                              {(() => {
                                const wins = parseInt(String(member.wins || member.gamesWon || 0));
                                const losses = parseInt(String(member.losses || member.gamesLost || 0));
                                const draws = parseInt(String(member.draws || member.ties || member.gamesDraw || 0));
                                const total = wins + losses + draws;
                                return total > 0 ? `${Math.round((wins / total) * 100)}%` : "—";
                              })()}
                            </div>
                          </div>

                          {/* Rating */}
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              fontFamily: 'Montserrat, sans-serif',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              marginBottom: '2px',
                              letterSpacing: '0.5px'
                            }}>RAT</div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#FFFFFF',
                              fontFamily: 'IBM Plex Mono, monospace',
                              textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
                            }}>
                              {(() => {
                                const rating = typeof member.ratingAve === 'number'
                                  ? member.ratingAve.toFixed(1)
                                  : parseFloat(String(member.ratingAve || 0)).toFixed(1);
                                return rating;
                              })()}
                            </div>
                          </div>

                          {/* Goals */}
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              fontFamily: 'Montserrat, sans-serif',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              marginBottom: '2px',
                              letterSpacing: '0.5px'
                            }}>G</div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#FFFFFF',
                              fontFamily: 'IBM Plex Mono, monospace',
                              textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
                            }}>
                              {safeRender(member.goals)}
                            </div>
                          </div>

                          {/* Assists */}
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              fontFamily: 'Montserrat, sans-serif',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              marginBottom: '2px',
                              letterSpacing: '0.5px'
                            }}>A</div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#FFFFFF',
                              fontFamily: 'IBM Plex Mono, monospace',
                              textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
                            }}>
                              {safeRender(member.assists)}
                            </div>
                          </div>

                          {/* MOTM */}
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              fontFamily: 'Montserrat, sans-serif',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              marginBottom: '2px',
                              letterSpacing: '0.5px'
                            }}>MOTM</div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#FFFFFF',
                              fontFamily: 'IBM Plex Mono, monospace',
                              textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
                            }}>
                              {safeRender(member.mom || member.motm || member.manOfTheMatch)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#6B7280',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '14px'
                }}>
                  No squad data available
                </div>
              )}
            </div>

            {/* Last 5 Matches */}
            <div style={{
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: 'Montserrat, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                margin: 0,
                marginBottom: '16px'
              }}>LAST 5 MATCHES</h2>

              {/* Match Type Selector */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <button
                  onClick={() => setLast5Filter('league')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: last5Filter === 'league' ? '#C9A84C' : '#2D2D2D',
                    color: last5Filter === 'league' ? '#000000' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Work Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  LEAGUE
                </button>
                <button
                  onClick={() => setLast5Filter('friendly')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: last5Filter === 'friendly' ? '#C9A84C' : '#2D2D2D',
                    color: last5Filter === 'friendly' ? '#000000' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Work Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  FRIENDLY
                </button>
              </div>

              {(() => {
                const filteredMatches = last5Filter === 'league'
                  ? [...matches.league, ...matches.playoff]
                  : matches.friendly;
                const allMatches = filteredMatches;
                if (allMatches.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: '#6B7280',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '14px'
                    }}>
                      No recent matches
                    </div>
                  );
                }

                const sortedMatches = allMatches
                  .filter(m => m.timestamp)
                  .sort((a, b) => {
                    const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
                    const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
                    return bTime - aTime;
                  })
                  .slice(0, 5);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sortedMatches.map((match, idx) => (
                      <MatchCard
                        key={idx}
                        match={match}
                        clubId={clubId}
                        platform={platform}
                        router={router}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          </div>
        </div>
      </main>
  );
}

const StatCard = React.memo<{ label: string; value: string | number }>(({ label, value }) => {
  return (
    <div style={{
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    }}>
      <div style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
        fontWeight: 600
      }}>{label}</div>
      <div className="stat-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// Helper function for adaptive player name font sizing
const getPlayerNameFontSize = (name: string): string => {
  const length = name.length;
  if (length <= 12) return '15px'; // Short names: normal size
  if (length <= 18) return '13px'; // Medium names: smaller
  return '11px'; // Long names: smallest
};

// Match Card Component
const MatchCard = React.memo<{
  match: Record<string, unknown>;
  clubId: string;
  platform: string;
  router: ReturnType<typeof useRouter>;
}>(({ match, clubId, platform, router }) => {
  const [showClubStats, setShowClubStats] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const clubs = (match.clubs as Record<string, Record<string, unknown>>) || {};
  const clubIds = Object.keys(clubs);
  const currentClub = clubs[clubId];
  const opponentId = clubIds.find((id) => id !== clubId);
  const opponent = opponentId ? clubs[opponentId] : null;

  if (!currentClub || !opponent) return null;

  // Determine result - always check goals first to handle quit games (3-0) correctly
  let result = "D";
  let resultColor = "#6B7280";

  const goalsFor = parseInt(String(currentClub.goals || "0"));
  const goalsAgainst = parseInt(String(currentClub.goalsAgainst || "0"));

  if (goalsFor > goalsAgainst) {
    result = "W";
    resultColor = "#22C55E";
  } else if (goalsFor < goalsAgainst) {
    result = "L";
    resultColor = "#DC2626";
  } else if (goalsFor === goalsAgainst) {
    // Only if goals are equal, check EA's result field as fallback
    if (currentClub.matchType === "5") {
      result = "D";
      resultColor = "#6B7280";
    } else {
      // League/playoff match - verify with result field
      if (currentClub.result === "1") {
        result = "W";
        resultColor = "#22C55E";
      } else if (currentClub.result === "2") {
        result = "L";
        resultColor = "#DC2626";
      } else {
        result = "D";
        resultColor = "#6B7280";
      }
    }
  }

  const matchPlayers = match.players as Record<string, Record<string, Record<string, unknown>>> | undefined;

  // Calculate team stats by summing player stats
  const calculateTeamStats = (clubPlayers: Record<string, Record<string, unknown>>) => {
    const players = Object.values(clubPlayers);
    const stats = {
      goals: 0,
      shots: 0,
      passes: 0,
      tackles: 0,
      yellowCards: 0,
      redCards: 0,
    };

    players.forEach(player => {
      stats.goals += parseInt(String(player.goals || 0));
      stats.shots += parseInt(String(player.shots || 0));
      stats.passes += parseInt(String(player.passesMade || player.passesCompleted || player.passattempts || 0));
      stats.tackles += parseInt(String(player.tackles || player.tacklesMade || 0));
      stats.yellowCards += parseInt(String(player.yellowcards || 0));
      stats.redCards += parseInt(String(player.redcards || 0));
    });

    return stats;
  };

  const currentTeamStats = matchPlayers?.[clubId] ? calculateTeamStats(matchPlayers[clubId]) : null;
  const opponentTeamStats = matchPlayers && opponentId && matchPlayers[opponentId] ? calculateTeamStats(matchPlayers[opponentId]) : null;

  return (
    <div style={{
      background: 'transparent',
      borderRadius: '8px',
      padding: '16px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Match Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        {/* Home Club */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <img
            src={getClubBadgeUrl(currentClub.details)}
            alt="Club"
            onClick={() => router.push(`/club/${clubId}?platform=${platform}`)}
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onError={(e) => {
              e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
            }}
          />
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              {String((currentClub.details as Record<string, unknown> | undefined)?.name || "Unknown")}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#9CA3AF',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              {formatDate(match.timestamp as number | string | undefined)}
            </div>
          </div>
        </div>

        {/* Score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 20px'
        }}>
          <div style={{
            background: resultColor,
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: 'IBM Plex Mono, monospace'
          }}>
            {result}
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: 'IBM Plex Mono, monospace'
          }}>
            {String(currentClub.goals || 0)} - {String(opponent.goals || 0)}
          </div>
        </div>

        {/* Away Club */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              {String((opponent.details as Record<string, unknown> | undefined)?.name || "Unknown")}
            </div>
          </div>
          <img
            src={getClubBadgeUrl(opponent.details)}
            alt="Opponent"
            onClick={() => opponentId && router.push(`/club/${opponentId}?platform=${platform}`)}
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onError={(e) => {
              e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={() => setShowClubStats(!showClubStats)}
          style={{
            flex: 1,
            background: showClubStats ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#FFFFFF',
            fontFamily: 'Montserrat, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!showClubStats) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            if (!showClubStats) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          }}
        >
          {showClubStats ? '▼' : '▶'} Club Stats
        </button>
        <button
          onClick={() => setShowPlayerStats(!showPlayerStats)}
          style={{
            flex: 1,
            background: showPlayerStats ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#FFFFFF',
            fontFamily: 'Montserrat, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!showPlayerStats) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            if (!showPlayerStats) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          }}
        >
          {showPlayerStats ? '▼' : '▶'} Player Stats
        </button>
      </div>

      {/* Club Stats Dropdown */}
      {showClubStats && currentTeamStats && opponentTeamStats && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div className="match-club-stats-grid">
            {/* Goals */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace' }}>
                {currentTeamStats.goals}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'center', minWidth: '120px' }}>
              GOALS
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace' }}>
                {opponentTeamStats.goals}
              </div>
            </div>

            {/* Shots */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace' }}>
                {currentTeamStats.shots}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
              SHOTS
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace' }}>
                {opponentTeamStats.shots}
              </div>
            </div>

            {/* Passes */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace' }}>
                {currentTeamStats.passes}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
              PASSES
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace' }}>
                {opponentTeamStats.passes}
              </div>
            </div>

            {/* Tackles */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace' }}>
                {currentTeamStats.tackles}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
              TACKLES
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace' }}>
                {opponentTeamStats.tackles}
              </div>
            </div>

            {/* Cards */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                {currentTeamStats.yellowCards > 0 && (
                  <span>{currentTeamStats.yellowCards}🟨</span>
                )}
                {currentTeamStats.redCards > 0 && (
                  <span>{currentTeamStats.redCards}🟥</span>
                )}
                {currentTeamStats.yellowCards === 0 && currentTeamStats.redCards === 0 && (
                  <span style={{ color: '#6B7280' }}>—</span>
                )}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
              CARDS
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'IBM Plex Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                {opponentTeamStats.yellowCards > 0 && (
                  <span>{opponentTeamStats.yellowCards}🟨</span>
                )}
                {opponentTeamStats.redCards > 0 && (
                  <span>{opponentTeamStats.redCards}🟥</span>
                )}
                {opponentTeamStats.yellowCards === 0 && opponentTeamStats.redCards === 0 && (
                  <span style={{ color: '#6B7280' }}>—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Stats Dropdown */}
      {showPlayerStats && matchPlayers && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px'
          }}>
            {/* Home Team Players */}
            <div>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: 'Montserrat, sans-serif',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                {String((currentClub.details as Record<string, unknown> | undefined)?.name || "Home")}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(matchPlayers[clubId] || {}).map(([playerId, player], idx) => {
                  const isExpanded = expandedPlayer === `home-${playerId}`;
                  return (
                    <div key={idx}>
                      <div
                        onClick={() => setExpandedPlayer(isExpanded ? null : `home-${playerId}`)}
                        style={{
                          display: 'flex',
                          flexWrap: 'nowrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          fontFamily: 'Montserrat, sans-serif',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                      >
                        <span style={{
                          color: '#FFFFFF',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flex: 1,
                          minWidth: 0
                        }}>
                          <span style={{ fontSize: '10px', flexShrink: 0 }}>{isExpanded ? '▼' : '▶'}</span>
                          <span style={{
                            fontSize: getPlayerNameFontSize(String(player.playername || "Unknown")),
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {String(player.playername || "Unknown")}
                          </span>
                        </span>
                        <div style={{ display: 'flex', gap: '8px', color: '#9CA3AF', flexShrink: 0, fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <span>G {String(player.goals || 0)}</span>
                          <span>A {String(player.assists || 0)}</span>
                          <span>R {String(player.rating || "-")}</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{
                          marginTop: '4px',
                          marginLeft: '16px',
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '11px',
                          fontFamily: 'Montserrat, sans-serif'
                        }}>
                          <div className="match-player-stats-grid">
                            {/* Left Column */}
                            <div><span style={{ color: '#6B7280' }}>Goals:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.goals || 0)}</span></div>
                            {/* Right Column */}
                            <div><span style={{ color: '#6B7280' }}>Tackles:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.tackles || 0)}</span></div>
                            {/* Left Column */}
                            <div><span style={{ color: '#6B7280' }}>Assists:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.assists || 0)}</span></div>
                            {/* Right Column */}
                            <div><span style={{ color: '#6B7280' }}>Rating:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.rating || "-")}</span></div>
                            {/* Left Column */}
                            <div><span style={{ color: '#6B7280' }}>Shots:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.shots || 0)}</span></div>
                            {/* Right Column */}
                            <div><span style={{ color: '#6B7280' }}>Position:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{capitalizeFirst(String(player.pos || player.position || "-"))}</span></div>
                            {/* Left Column */}
                            <div><span style={{ color: '#6B7280' }}>Passes:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.passesMade || player.passesCompleted || player.passattempts || 0)}</span></div>
                            {/* Right Column */}
                            <div>
                              <span style={{ color: '#6B7280' }}>Cards:</span>{' '}
                              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                                {Boolean(player.yellowcards || player.redcards) ? (
                                  <>
                                    {player.yellowcards ? `${String(player.yellowcards)}🟨 ` : ''}
                                    {player.redcards ? `${String(player.redcards)}🟥` : ''}
                                  </>
                                ) : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Away Team Players */}
            <div>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: 'Montserrat, sans-serif',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                {String((opponent.details as Record<string, unknown> | undefined)?.name || "Away")}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {opponentId && Object.entries(matchPlayers[opponentId] || {}).map(([playerId, player], idx) => {
                  const isExpanded = expandedPlayer === `away-${playerId}`;
                  return (
                    <div key={idx}>
                      <div
                        onClick={() => setExpandedPlayer(isExpanded ? null : `away-${playerId}`)}
                        style={{
                          display: 'flex',
                          flexWrap: 'nowrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          fontFamily: 'Montserrat, sans-serif',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                      >
                        <span style={{
                          color: '#FFFFFF',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flex: 1,
                          minWidth: 0
                        }}>
                          <span style={{ fontSize: '10px', flexShrink: 0 }}>{isExpanded ? '▼' : '▶'}</span>
                          <span style={{
                            fontSize: getPlayerNameFontSize(String(player.playername || "Unknown")),
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {String(player.playername || "Unknown")}
                          </span>
                        </span>
                        <div style={{ display: 'flex', gap: '8px', color: '#9CA3AF', flexShrink: 0, fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <span>G {String(player.goals || 0)}</span>
                          <span>A {String(player.assists || 0)}</span>
                          <span>R {String(player.rating || "-")}</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{
                          marginTop: '4px',
                          marginLeft: '16px',
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '11px',
                          fontFamily: 'Montserrat, sans-serif'
                        }}>
                          <div className="match-player-stats-grid">
                            {/* Left Column */}
                            <div><span style={{ color: '#6B7280' }}>Goals:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.goals || 0)}</span></div>
                            {/* Right Column */}
                            <div><span style={{ color: '#6B7280' }}>Tackles:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.tackles || 0)}</span></div>
                            {/* Left Column */}
                            <div><span style={{ color: '#6B7280' }}>Assists:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.assists || 0)}</span></div>
                            {/* Right Column */}
                            <div><span style={{ color: '#6B7280' }}>Rating:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.rating || "-")}</span></div>
                            {/* Left Column */}
                            <div><span style={{ color: '#6B7280' }}>Shots:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.shots || 0)}</span></div>
                            {/* Right Column */}
                            <div><span style={{ color: '#6B7280' }}>Position:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{capitalizeFirst(String(player.pos || player.position || "-"))}</span></div>
                            {/* Left Column */}
                            <div><span style={{ color: '#6B7280' }}>Passes:</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{String(player.passesMade || player.passesCompleted || player.passattempts || 0)}</span></div>
                            {/* Right Column */}
                            <div>
                              <span style={{ color: '#6B7280' }}>Cards:</span>{' '}
                              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                                {Boolean(player.yellowcards || player.redcards) ? (
                                  <>
                                    {player.yellowcards ? `${String(player.yellowcards)}🟨 ` : ''}
                                    {player.redcards ? `${String(player.redcards)}🟥` : ''}
                                  </>
                                ) : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MatchCard.displayName = 'MatchCard';
