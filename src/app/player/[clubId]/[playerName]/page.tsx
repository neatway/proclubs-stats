"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import ClaimPlayerModal from "@/components/ClaimPlayerModal";
import { safeJson, normalizeMembers, capitalizeFirst, getClubBadgeUrl, formatHeightForViewer } from "@/lib/utils";
import { getDiscordAvatarUrl } from "@/lib/auth";
import { fetchEAWithProxy } from "@/lib/ea-proxy";

interface ClaimedPlayerData {
  id: string;
  userId: string;
  bio: string | null;
  profilePictureUrl: string | null;
  likesCount: number;
  dislikesCount: number;
  verifiedAt: string;
  user: {
    discordId: string;
    username: string;
    avatarHash: string | null;
  };
}

interface PlayerLike {
  action: "like" | "dislike";
}

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const clubId = params.clubId as string;
  const playerName = decodeURIComponent(params.playerName as string);
  const platform = searchParams.get("platform") ?? "common-gen5";

  const [clubStatsData, setClubStatsData] = useState<Record<string, unknown> | null>(null);
  const [careerStatsData, setCareerStatsData] = useState<Record<string, unknown> | null>(null);
  const [clubInfo, setClubInfo] = useState<Record<string, unknown> | null>(null);
  const [claimedData, setClaimedData] = useState<ClaimedPlayerData | null>(null);
  const [userVote, setUserVote] = useState<PlayerLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);

  // Bio editing state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Claim modal state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Toggle for stats (total vs per 90)
  const [showCareerPer90, setShowCareerPer90] = useState(false);
  const [showClubPer90, setShowClubPer90] = useState(false);
  const [showLast5Per90, setShowLast5Per90] = useState(false);

  // Match data for Last 5 Games
  const [matches, setMatches] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isOwnProfile = claimedData && session?.user?.id === claimedData.userId;

  const fetchPlayerData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stats data and matches via CORS proxy
      const [clubStatsMembers, careerStatsMembers, clubInfoData, leagueMatches, playoffMatches, friendlyMatches] = await Promise.all([
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/members/club/stats?platform=${platform}&clubId=${clubId}`).catch(() => null),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/members/career/stats?platform=${platform}&clubId=${clubId}`).catch(() => null),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/info?platform=${platform}&clubIds=${clubId}`),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/matches?platform=${platform}&clubIds=${clubId}&matchType=leagueMatch`, { timeout: 15000 }).catch(() => []),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/matches?platform=${platform}&clubIds=${clubId}&matchType=playoffMatch`, { timeout: 15000 }).catch(() => []),
        fetchEAWithProxy(`https://proclubs.ea.com/api/fc/clubs/matches?platform=${platform}&clubIds=${clubId}&matchType=friendlyMatch`, { timeout: 15000 }).catch(() => []),
      ]);

      // Extract club info
      if (clubInfoData) {
        const extracted = clubInfoData[clubId] || clubInfoData;
        setClubInfo(extracted);
      }

      // Process matches - combine all match types
      const allMatches = [
        ...(Array.isArray(leagueMatches) ? leagueMatches : []),
        ...(Array.isArray(playoffMatches) ? playoffMatches : []),
        ...(Array.isArray(friendlyMatches) ? friendlyMatches : [])
      ];

      // Sort by timestamp (newest first)
      const sortedMatches = allMatches
        .filter(m => m && typeof m === 'object' && 'timestamp' in m)
        .sort((a, b) => {
          const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
          const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
          return bTime - aTime;
        });

      setMatches(sortedMatches);

      // Normalize members first to get personaId
      const normalizedClubMembers = clubStatsMembers ? normalizeMembers(clubStatsMembers) : [];
      const normalizedCareerMembers = careerStatsMembers ? normalizeMembers(careerStatsMembers) : [];

      // Find the specific player from normalized data
      const clubPlayer = normalizedClubMembers.find(
        (m) => m.name.toLowerCase() === playerName.toLowerCase()
      );
      const careerPlayer = normalizedCareerMembers.find(
        (m) => m.name.toLowerCase() === playerName.toLowerCase()
      );

      if (!clubPlayer && !careerPlayer) {
        setError("Player not found in this club");
        return;
      }

      setClubStatsData(clubPlayer as unknown as Record<string, unknown>);
      setCareerStatsData(careerPlayer as unknown as Record<string, unknown>);

      // Get personaId from normalized data (optional - may be undefined)
      const personaId = clubPlayer?.personaId || careerPlayer?.personaId;
      setPersonaId(personaId || null);

      // Fetch claimed player data using playerName (personaId as fallback)
      const claimedRes = await fetch(
        `/api/player/claimed-data?platform=${platform}&playerName=${encodeURIComponent(playerName)}`
      );
      if (claimedRes.ok) {
        const data = await claimedRes.json();
        if (data.claimedPlayer) {
          console.log('Claimed player data received:', data.claimedPlayer);
          console.log('User fields:', data.claimedPlayer.user);
          console.log('Username:', data.claimedPlayer.user?.username);
          setClaimedData(data.claimedPlayer);
          setBioText(data.claimedPlayer.bio || "");
          if (data.userVote) {
            setUserVote(data.userVote);
          }
        }
      }
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || "Failed to load player data");
    } finally {
      setLoading(false);
    }
  }, [clubId, playerName, platform, session?.user]);

  useEffect(() => {
    if (!clubId || !playerName) return;
    fetchPlayerData();
  }, [clubId, playerName, fetchPlayerData]);

  // Handle like/dislike
  const handleVote = async (action: "like" | "dislike") => {
    if (!session?.user || !claimedData) return;

    try {
      const response = await fetch("/api/player/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: claimedData.id,
          action,
        }),
      });

      if (response.ok) {
        // Refresh data to get updated counts
        fetchPlayerData();
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  // Handle bio save
  const handleSaveBio = async () => {
    if (!claimedData) return;

    setIsSavingBio(true);
    try {
      const response = await fetch("/api/player/bio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: claimedData.id,
          bio: bioText,
        }),
      });

      if (response.ok) {
        setIsEditingBio(false);
        fetchPlayerData(); // Refresh to get updated bio
      }
    } catch (error) {
      console.error("Error saving bio:", error);
    } finally {
      setIsSavingBio(false);
    }
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

  const clubStats = clubStatsData || {};
  const careerStats = careerStatsData || {};

  // Parse values
  const parseNum = (val: unknown) => {
    if (!val) return 0;
    if (typeof val === "string") return parseInt(val, 10);
    if (typeof val === "number") return val;
    return 0;
  };

  const parseFloatNum = (val: unknown) => {
    if (!val) return 0;
    if (typeof val === "string") return parseFloat(val);
    if (typeof val === "number") return val;
    return 0;
  };

  // Get profile picture - use Discord avatar if claimed, otherwise generate placeholder
  const profilePictureUrl = claimedData
    ? getDiscordAvatarUrl(claimedData.user.discordId, claimedData.user.avatarHash, 256)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=256&background=667eea&color=fff&bold=true`;

  return (
    <main style={{
      minHeight: '100vh',
      paddingTop: '64px',
      paddingLeft: '24px',
      paddingRight: '24px',
      paddingBottom: '24px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Breadcrumb navigation - subtle and compact */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#9CA3AF',
          marginTop: '16px',
          marginBottom: '12px',
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

          <Link
            href={`/club/${clubId}?platform=${platform}`}
            style={{
              color: '#9CA3AF',
              textDecoration: 'none',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
          >
            {String(clubInfo?.name || "Club")}
          </Link>

          <span style={{ color: '#6B7280' }}>/</span>

          <span style={{ color: '#FFFFFF', fontWeight: 500 }}>
            {playerName}
          </span>
        </div>

        {/* PLAYER PROFILE HEADER - FIXED 2-COLUMN LAYOUT */}
        <div style={{
          background: '#1D1D1D',
          padding: isMobile ? '20px' : 'clamp(20px, 4vw, 32px)',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '20px' : '32px',
          alignItems: isMobile ? 'center' : 'flex-start',
          marginBottom: '16px'
        }}>
          {/* LEFT COLUMN: Player Info */}
          <div style={{
            flex: 1,
            minWidth: isMobile ? '0' : '300px',
            width: isMobile ? '100%' : 'auto',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '16px' : 'clamp(16px, 3vw, 24px)',
            alignItems: isMobile ? 'center' : 'flex-start'
          }}>
            {/* Profile Picture */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={profilePictureUrl}
                alt={playerName}
                style={{
                  width: isMobile ? '100px' : 'clamp(100px, 15vw, 140px)',
                  height: isMobile ? '100px' : 'clamp(100px, 15vw, 140px)',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}
              />
              {claimedData && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#10B981',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #1D1D1D',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FFFFFF'
                }}>
                  ✓
                </div>
              )}
            </div>

            {/* Player Details - stacked naturally */}
            <div style={{
              flex: 1,
              width: isMobile ? '100%' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMobile ? 'center' : 'flex-start',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              {/* Player Name + Overall Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '8px'
              }}>
                <h1 style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 'clamp(24px, 4vw, 42px)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: 0,
                  lineHeight: 1,
                  color: '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                }}>
                  {playerName}
                </h1>
                {Boolean(clubStats.proOverall) && (
                  <div style={{
                    background: '#22C55E',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: 'clamp(18px, 3vw, 24px)',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: 'IBM Plex Mono, monospace',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)',
                    lineHeight: 1
                  }}>
                    {parseNum(clubStats.proOverall)}
                  </div>
                )}
              </div>

              {/* Player Details Row: Pro Name • Position • Height • Flag */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: '8px',
                flexWrap: 'nowrap',
                fontFamily: 'Work Sans, sans-serif',
                fontSize: isMobile ? '14px' : 'clamp(16px, 2.5vw, 17px)',
                color: '#FFFFFF',
                fontWeight: 500,
                marginBottom: '12px'
              }}>
                {Boolean(clubStats.proName) && (
                  <>
                    <span style={{ color: '#FFFFFF' }}>{String(clubStats.proName)}</span>
                    <span style={{ color: '#6B7280' }}>•</span>
                  </>
                )}
                <span style={{ color: '#FFFFFF' }}>{capitalizeFirst(String(clubStats.favoritePosition || clubStats.proPos || "")) || "Forward"}</span>
                <span style={{ color: '#6B7280' }}>•</span>
                <span style={{ color: '#FFFFFF' }}>{formatHeightForViewer(clubStats.proHeight)}</span>
                {Boolean(clubStats.proNationality) && (
                  <>
                    <span style={{ color: '#6B7280' }}>•</span>
                    <img
                      src={`https://media.contentapi.ea.com/content/dam/ea/fifa/fifa-21/ratings-collective/f20assets/country-flags/${clubStats.proNationality}.png`}
                      alt="Flag"
                      style={{
                        width: '22px',
                        height: '16px',
                        objectFit: 'cover',
                        borderRadius: '2px',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                      }}
                    />
                  </>
                )}
              </div>

              {/* Club Name with Badge - directly below details */}
              <div
                onClick={() => router.push(`/club/${clubId}?platform=${platform}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <img
                  src={getClubBadgeUrl(clubInfo)}
                  alt="Club badge"
                  style={{
                    width: '44px',
                    height: '44px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";
                  }}
                />
                <span style={{
                  fontSize: '18px',
                  color: '#FFFFFF',
                  fontFamily: 'Work Sans, sans-serif',
                  fontWeight: 600
                }}>
                  {String(clubInfo?.name || "Unknown Club")}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Bio + Discord + Like/Dislike */}
          <div style={{
            flex: 1,
            minWidth: '0',
            maxWidth: isMobile ? 'none' : '500px',
            width: isMobile ? '100%' : 'auto'
          }}>
            <div style={{
              background: '#2D2D2D',
              borderRadius: '12px',
              padding: '18px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              height: 'fit-content'
            }}>
              {/* Bio Text + Edit Button - ALWAYS SHOW */}
              {isEditingBio ? (
                <div>
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value.slice(0, 500))}
                    maxLength={500}
                    placeholder="Tell us about yourself..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      background: '#1D1D1D',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '15px',
                      color: '#FFFFFF',
                      fontFamily: 'Work Sans, sans-serif',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {bioText.length}/500
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setBioText(claimedData?.bio || "");
                          setIsEditingBio(false);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          fontFamily: 'Work Sans, sans-serif'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={isSavingBio}
                        style={{
                          background: '#00D9FF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0A0A0A',
                          cursor: isSavingBio ? 'not-allowed' : 'pointer',
                          fontFamily: 'Work Sans, sans-serif'
                        }}
                      >
                        {isSavingBio ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '16px',
                      color: claimedData?.bio ? '#9CA3AF' : '#6B7280',
                      fontFamily: 'Work Sans, sans-serif',
                      lineHeight: 1.5,
                      margin: 0,
                      fontStyle: claimedData?.bio ? 'normal' : 'italic',
                      textAlign: isMobile ? 'center' : 'left'
                    }}>
                      {claimedData?.bio || "This player has not added a bio yet."}
                    </p>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#CACFD6',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'Work Sans, sans-serif',
                        flexShrink: 0
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}

              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'rgba(255, 255, 255, 0.1)',
                margin: '4px 0'
              }} />

              {/* Discord + Like/Dislike Section - ALWAYS SHOW */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {/* Discord Info - ALWAYS SHOW */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: claimedData?.user?.username ? '#FFFFFF' : '#6B7280',
                  fontSize: '16px',
                  fontFamily: 'Work Sans, sans-serif',
                  fontWeight: 500
                }}>
                  <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill={claimedData?.user?.username ? "#5865F2" : "#4B5563"}/>
                  </svg>
                  <span style={{ color: claimedData?.user?.username ? '#CACFD6' : '#6B7280' }}>
                    {claimedData?.user?.username || "Not connected"}
                  </span>
                </div>

                {/* Like/Dislike Badges - ALWAYS SHOW */}
                {claimedData ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Thumbs Up Badge */}
                    <div
                      onClick={() => session?.user && handleVote("like")}
                      style={{
                        background: userVote?.action === "like" ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '15px',
                        cursor: session?.user ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s ease',
                        border: `1px solid ${userVote?.action === "like" ? '#22C55E' : 'transparent'}`
                      }}
                    >
                      <span>👍</span>
                      <span style={{ color: '#22C55E', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>
                        {claimedData.likesCount || 0}
                      </span>
                    </div>

                    {/* Thumbs Down Badge */}
                    <div
                      onClick={() => session?.user && handleVote("dislike")}
                      style={{
                        background: userVote?.action === "dislike" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '15px',
                        cursor: session?.user ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s ease',
                        border: `1px solid ${userVote?.action === "dislike" ? '#EF4444' : 'transparent'}`
                      }}
                    >
                      <span>👎</span>
                      <span style={{ color: '#EF4444', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>
                        {claimedData.dislikesCount || 0}
                      </span>
                    </div>
                  </div>
                ) : session?.user ? (
                  <button
                    onClick={() => setIsClaimModalOpen(true)}
                    style={{
                      background: '#00D9FF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0A0A0A',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Work Sans, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(0, 217, 255, 0.3)',
                      marginLeft: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#33E3FF';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#00D9FF';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Claim Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Show 0 counts for unclaimed + not logged in */}
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '15px'
                    }}>
                      <span>👍</span>
                      <span style={{ color: '#22C55E', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>0</span>
                    </div>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '15px'
                    }}>
                      <span>👎</span>
                      <span style={{ color: '#EF4444', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>0</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CAREER TOTALS SECTION (ALL CLUBS) */}
        {(() => {
          const games = parseNum(careerStats.gamesPlayed);
          const goals = parseNum(careerStats.goals);
          const assists = parseNum(careerStats.assists);
          const motm = parseNum(careerStats.manOfTheMatch || careerStats.mom || careerStats.motm);

          const goalsPer90 = games > 0 ? (goals / games).toFixed(2) : "0.00";
          const assistsPer90 = games > 0 ? (assists / games).toFixed(2) : "0.00";
          const motmPer90 = games > 0 ? (motm / games).toFixed(2) : "0.00";

          return (
            <div style={{
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              marginBottom: '16px'
            }}>
              {/* Header with Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  margin: 0
                }}>
                  Career Totals (All Clubs)
                </h2>

                {/* Toggle Button */}
                <div style={{
                  display: 'flex',
                  background: '#2A2A2A',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <button
                    onClick={() => setShowCareerPer90(false)}
                    style={{
                      background: !showCareerPer90 ? '#00D9FF' : 'transparent',
                      color: !showCareerPer90 ? '#0A0A0A' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
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
                    onClick={() => setShowCareerPer90(true)}
                    style={{
                      background: showCareerPer90 ? '#00D9FF' : 'transparent',
                      color: showCareerPer90 ? '#0A0A0A' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
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

              {/* Stats Grid */}
              <div className="player-stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}>
                {!showCareerPer90 ? (
                  <>
                    <StatCard label="Total Games" value={games} />
                    <StatCard label="Total Goals" value={goals} />
                    <StatCard label="Total Assists" value={assists} />
                    <StatCard label="Average Rating" value={parseFloatNum(careerStats.ratingAve).toFixed(1)} />
                    <StatCard label="Total MOTM" value={motm} />
                    <StatCard label="Win Rate" value={careerStats.winRate ? `${String(careerStats.winRate)}%` : "—"} />
                  </>
                ) : (
                  <>
                    <StatCard label="Total Games" value={games} />
                    <StatCard label="Goals per 90" value={goalsPer90} />
                    <StatCard label="Assists per 90" value={assistsPer90} />
                    <StatCard label="Average Rating" value={parseFloatNum(careerStats.ratingAve).toFixed(1)} />
                    <StatCard label="MOTM per 90" value={motmPer90} />
                    <StatCard label="Win Rate" value={careerStats.winRate ? `${String(careerStats.winRate)}%` : "—"} />
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* STATS WITH CURRENT CLUB SECTION */}
        {(() => {
          const games = parseNum(clubStats.gamesPlayed);

          // Calculate totals
          const goals = parseNum(clubStats.goals);
          const assists = parseNum(clubStats.assists);
          const motm = parseNum(clubStats.manOfTheMatch || clubStats.mom || clubStats.motm);
          const passes = parseNum(clubStats.passesMade);
          const tackles = parseNum(clubStats.tacklesMade);
          const shots = parseNum(clubStats.shots);
          const cleanSheets = parseNum(clubStats.cleanSheets || clubStats.cleanSheetsGK);
          const redCards = parseNum(clubStats.redCards);
          const yellowCards = parseNum(clubStats.yellowCards);

          // Calculate per 90
          const goalsPer90 = games > 0 ? (goals / games).toFixed(2) : "0.00";
          const assistsPer90 = games > 0 ? (assists / games).toFixed(2) : "0.00";
          const motmPer90 = games > 0 ? (motm / games).toFixed(2) : "0.00";
          const passesPer90 = games > 0 ? (passes / games).toFixed(2) : "0.00";
          const tacklesPer90 = games > 0 ? (tackles / games).toFixed(2) : "0.00";
          const shotsPer90 = games > 0 ? (shots / games).toFixed(2) : "0.00";
          const cleanSheetsPer90 = games > 0 ? (cleanSheets / games).toFixed(2) : "0.00";
          const redCardsPer90 = games > 0 ? (redCards / games).toFixed(2) : "0.00";
          const yellowCardsPer90 = games > 0 ? (yellowCards / games).toFixed(2) : "0.00";

          return (
            <div style={{
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              marginBottom: '16px'
            }}>
              {/* Header with Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  margin: 0
                }}>
                  Stats with {String(clubInfo?.name || "Current Club")}
                </h2>

                {/* Toggle Button */}
                <div style={{
                  display: 'flex',
                  background: '#2A2A2A',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <button
                    onClick={() => setShowClubPer90(false)}
                    style={{
                      background: !showClubPer90 ? '#00D9FF' : 'transparent',
                      color: !showClubPer90 ? '#0A0A0A' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
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
                    onClick={() => setShowClubPer90(true)}
                    style={{
                      background: showClubPer90 ? '#00D9FF' : 'transparent',
                      color: showClubPer90 ? '#0A0A0A' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
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

              {/* Stats Grid */}
              <div className="player-stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}>
                {!showClubPer90 ? (
                  // Total Stats
                  <>
                    <StatCard label="Games Played" value={games} />
                    <StatCard label="Goals" value={goals} />
                    <StatCard label="Assists" value={assists} />
                    <StatCard label="Average Rating" value={parseFloatNum(clubStats.ratingAve).toFixed(1)} />
                    <StatCard label="Win Rate" value={clubStats.winRate ? `${String(clubStats.winRate)}%` : "—"} />
                    <StatCard label="Man of the Match" value={motm} />
                    <StatCard label="Clean Sheets" value={cleanSheets} />
                    <StatCard label="Passes Made" value={passes.toLocaleString()} />
                    <StatCard label="Pass Success" value={clubStats.passSuccessRate ? `${String(clubStats.passSuccessRate)}%` : "—"} />
                    <StatCard label="Tackles Made" value={tackles} />
                    <StatCard label="Tackle Success" value={clubStats.tackleSuccessRate ? `${String(clubStats.tackleSuccessRate)}%` : "—"} />
                    <StatCard label="Shots" value={shots} />
                    <StatCard label="Shot Success" value={clubStats.shotSuccessRate ? `${String(clubStats.shotSuccessRate)}%` : "—"} />
                    <StatCard label="Red Cards" value={redCards} />
                    <StatCard label="Yellow Cards" value={yellowCards} />
                  </>
                ) : (
                  // Per 90 Stats
                  <>
                    <StatCard label="Games Played" value={games} />
                    <StatCard label="Goals per 90" value={goalsPer90} />
                    <StatCard label="Assists per 90" value={assistsPer90} />
                    <StatCard label="Average Rating" value={parseFloatNum(clubStats.ratingAve).toFixed(1)} />
                    <StatCard label="Win Rate" value={clubStats.winRate ? `${String(clubStats.winRate)}%` : "—"} />
                    <StatCard label="MOTM per 90" value={motmPer90} />
                    <StatCard label="Clean Sheets per 90" value={cleanSheetsPer90} />
                    <StatCard label="Passes per 90" value={passesPer90} />
                    <StatCard label="Pass Success" value={clubStats.passSuccessRate ? `${String(clubStats.passSuccessRate)}%` : "—"} />
                    <StatCard label="Tackles per 90" value={tacklesPer90} />
                    <StatCard label="Tackle Success" value={clubStats.tackleSuccessRate ? `${String(clubStats.tackleSuccessRate)}%` : "—"} />
                    <StatCard label="Shots per 90" value={shotsPer90} />
                    <StatCard label="Shot Success" value={clubStats.shotSuccessRate ? `${String(clubStats.shotSuccessRate)}%` : "—"} />
                    <StatCard label="Red Cards per 90" value={redCardsPer90} />
                    <StatCard label="Yellow Cards per 90" value={yellowCardsPer90} />
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* LAST 5 GAMES STATS SECTION */}
        {(() => {
          // Filter matches where the player participated
          const playerMatches = matches.filter(match => {
            const clubs = (match.clubs as Record<string, Record<string, unknown>>) || {};
            const currentClub = clubs[clubId];
            if (!currentClub) return false;

            const matchPlayers = match.players as Record<string, Record<string, unknown>> | undefined;
            const players = matchPlayers?.[clubId] || {};
            const playerList = Object.values(players);

            // Check if player participated in this match
            return playerList.some((p: unknown) => {
              const player = p as Record<string, unknown>;
              const pName = String(player.playername || player.playerName || player.name || '');
              return pName.toLowerCase() === playerName.toLowerCase();
            });
          }).slice(0, 5);

          if (playerMatches.length === 0) {
            return null;
          }

          // Calculate aggregated stats from last 5 games
          let totalGoals = 0;
          let totalAssists = 0;
          let totalPasses = 0;
          let totalTackles = 0;
          let totalShots = 0;
          let totalRating = 0;
          let gamesWithRating = 0;

          playerMatches.forEach(match => {
            const matchPlayers = match.players as Record<string, Record<string, unknown>> | undefined;
            const players = matchPlayers?.[clubId] || {};
            const playerList = Object.values(players);

            const playerData = playerList.find((p: unknown) => {
              const player = p as Record<string, unknown>;
              const pName = String(player.playername || player.playerName || player.name || '');
              return pName.toLowerCase() === playerName.toLowerCase();
            }) as Record<string, unknown> | undefined;

            if (playerData) {
              totalGoals += parseInt(String(playerData.goals || 0));
              totalAssists += parseInt(String(playerData.assists || 0));
              totalPasses += parseInt(String(playerData.passesMade || playerData.passesCompleted || 0));
              totalTackles += parseInt(String(playerData.tackles || playerData.tacklesMade || 0));
              totalShots += parseInt(String(playerData.shots || 0));

              const rating = parseFloat(String(playerData.rating || 0));
              if (rating > 0) {
                totalRating += rating;
                gamesWithRating++;
              }
            }
          });

          const avgRating = gamesWithRating > 0 ? (totalRating / gamesWithRating).toFixed(1) : "—";
          const avgGoals = playerMatches.length > 0 ? (totalGoals / playerMatches.length).toFixed(2) : "0.00";
          const avgAssists = playerMatches.length > 0 ? (totalAssists / playerMatches.length).toFixed(2) : "0.00";
          const avgPasses = playerMatches.length > 0 ? (totalPasses / playerMatches.length).toFixed(2) : "0.00";
          const avgTackles = playerMatches.length > 0 ? (totalTackles / playerMatches.length).toFixed(2) : "0.00";
          const avgShots = playerMatches.length > 0 ? (totalShots / playerMatches.length).toFixed(2) : "0.00";

          return (
            <div style={{
              background: '#1D1D1D',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              marginBottom: '16px'
            }}>
              {/* Header with Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  margin: 0
                }}>
                  Last {playerMatches.length} {playerMatches.length === 1 ? 'Game' : 'Games'}
                </h2>

                {/* Toggle Button */}
                <div style={{
                  display: 'flex',
                  background: '#2A2A2A',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <button
                    onClick={() => setShowLast5Per90(false)}
                    style={{
                      background: !showLast5Per90 ? '#00D9FF' : 'transparent',
                      color: !showLast5Per90 ? '#0A0A0A' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
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
                    onClick={() => setShowLast5Per90(true)}
                    style={{
                      background: showLast5Per90 ? '#00D9FF' : 'transparent',
                      color: showLast5Per90 ? '#0A0A0A' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
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

              {/* Stats Grid */}
              <div className="player-stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}>
                {!showLast5Per90 ? (
                  // Total Stats
                  <>
                    <StatCard label="Games" value={playerMatches.length} />
                    <StatCard label="Total Goals" value={totalGoals} />
                    <StatCard label="Total Assists" value={totalAssists} />
                    <StatCard label="Average Rating" value={avgRating} />
                    <StatCard label="Total Passes" value={totalPasses} />
                    <StatCard label="Total Tackles" value={totalTackles} />
                    <StatCard label="Total Shots" value={totalShots} />
                  </>
                ) : (
                  // Per 90 Stats
                  <>
                    <StatCard label="Games" value={playerMatches.length} />
                    <StatCard label="Goals per Game" value={avgGoals} />
                    <StatCard label="Assists per Game" value={avgAssists} />
                    <StatCard label="Average Rating" value={avgRating} />
                    <StatCard label="Passes per Game" value={avgPasses} />
                    <StatCard label="Tackles per Game" value={avgTackles} />
                    <StatCard label="Shots per Game" value={avgShots} />
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Claim Player Modal */}
      <ClaimPlayerModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        playerName={playerName}
        personaId={personaId || ""}  // Pass empty string if no personaId (we use playerName as primary identifier)
        clubId={clubId}
        clubName={String(clubInfo?.name || "Unknown Club")}
        platform={platform}
        onClaimSuccess={() => {
          // Refetch player data to update claimed status
          fetchPlayerData();
        }}
      />
    </main>
  );
}

// StatCard component matching club page design
function StatCard({ label, value, highlighted }: { label: string; value: string | number; highlighted?: boolean }) {
  return (
    <div style={{
      background: highlighted ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#2A2A2A',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: highlighted ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
    }}>
      <div style={{
        fontSize: '11px',
        color: '#9CA3AF',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 500,
        textTransform: 'uppercase',
        marginBottom: '8px',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: highlighted ? '32px' : '24px',
        fontWeight: 700,
        color: '#FFFFFF',
        fontFamily: 'IBM Plex Mono, monospace',
        textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
        lineHeight: 1
      }}>
        {value}
      </div>
    </div>
  );
}
