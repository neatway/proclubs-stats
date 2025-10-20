"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import ClaimPlayerModal from "@/components/ClaimPlayerModal";
import { safeJson, normalizeMembers } from "@/lib/utils";
import { getDiscordAvatarUrl } from "@/lib/auth";

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

  const isOwnProfile = claimedData && session?.user?.id === claimedData.userId;

  const fetchPlayerData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stats data
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

      // Normalize members first to get personaId
      const normalizedClubMembers = normalizeMembers(clubStatsMembers);
      const normalizedCareerMembers = normalizeMembers(careerStatsMembers);

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
    <main style={{ minHeight: '100vh', paddingTop: '64px', padding: 'var(--space-xl)', background: 'var(--bg-page)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {/* Breadcrumb */}
        <Link
          href={`/club/${clubId}?platform=${platform}`}
          className="btn-secondary"
          style={{ display: 'inline-flex', width: 'fit-content' }}
        >
          ← Back to {clubInfo?.name || "Club"}
        </Link>

        {/* PLAYER PROFILE HEADER */}
        <div style={{
          background: '#1D1D1D',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 3vw, 40px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
        }}>
          {/* Profile Picture */}
          <div style={{ position: 'relative' }}>
            <img
              src={profilePictureUrl}
              alt={playerName}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
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

          {/* Player Name & Position */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              margin: '0 0 8px 0',
              lineHeight: 1,
              color: '#FFFFFF',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
            }}>
              {playerName}
            </h1>
            <p style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 'clamp(16px, 3vw, 20px)',
              fontWeight: 400,
              color: '#CACFD6',
              margin: 0,
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
            }}>
              {clubStats.proPos || clubStats.favoritePosition || "Player"} • {clubInfo?.name || "Unknown Club"}
            </p>
          </div>

          {/* Like/Dislike Buttons OR Claim Button */}
          {claimedData ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center'
            }}>
              <button
                onClick={() => handleVote("like")}
                disabled={!session?.user}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: userVote?.action === "like" ? '#10B981' : 'transparent',
                  border: `2px solid ${userVote?.action === "like" ? '#10B981' : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: session?.user ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  fontFamily: 'IBM Plex Mono, monospace'
                }}
              >
                <span style={{ fontSize: '24px' }}>👍</span>
                {claimedData.likesCount}
              </button>

              <button
                onClick={() => handleVote("dislike")}
                disabled={!session?.user}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: userVote?.action === "dislike" ? '#DC2626' : 'transparent',
                  border: `2px solid ${userVote?.action === "dislike" ? '#DC2626' : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: session?.user ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  fontFamily: 'IBM Plex Mono, monospace'
                }}
              >
                <span style={{ fontSize: '24px' }}>👎</span>
                {claimedData.dislikesCount}
              </button>
            </div>
          ) : session?.user ? (
            <button
              onClick={() => setIsClaimModalOpen(true)}
              style={{
                background: '#00D9FF',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 700,
                color: '#0A0A0A',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Work Sans, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 12px rgba(0, 217, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#33E3FF';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 217, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00D9FF';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 217, 255, 0.3)';
              }}
            >
              Claim Profile
            </button>
          ) : null}
        </div>

        {/* BIO SECTION */}
        {(claimedData || isOwnProfile) && (
          <div style={{
            background: '#1D1D1D',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: 'Montserrat, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                margin: 0
              }}>About</h2>

              {isOwnProfile && !isEditingBio && (
                <button
                  onClick={() => setIsEditingBio(true)}
                  style={{
                    background: 'transparent',
                    border: '2px solid #00D9FF',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#00D9FF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Work Sans, sans-serif'
                  }}
                >
                  Edit Bio
                </button>
              )}
            </div>

            {isEditingBio ? (
              <div>
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value.slice(0, 500))}
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    background: '#2A2A2A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#FFFFFF',
                    fontFamily: 'Work Sans, sans-serif',
                    resize: 'vertical'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px'
                }}>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {bioText.length}/500 characters
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setBioText(claimedData?.bio || "");
                        setIsEditingBio(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '8px 16px',
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
                        padding: '8px 16px',
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
              <p style={{
                fontSize: '14px',
                color: '#CACFD6',
                fontFamily: 'Work Sans, sans-serif',
                lineHeight: 1.6,
                margin: 0
              }}>
                {claimedData?.bio || (isOwnProfile ? "Add a bio to tell others about yourself!" : "This player hasn't added a bio yet.")}
              </p>
            )}
          </div>
        )}

        {/* PLAYER STATS - Hero Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <StatCard label="Overall" value={clubStats.proOverall ? parseNum(clubStats.proOverall) : "—"} highlighted />
          <StatCard label="Games Played" value={parseNum(clubStats.gamesPlayed)} />
          <StatCard label="Goals" value={parseNum(clubStats.goals)} />
          <StatCard label="Assists" value={parseNum(clubStats.assists)} />
        </div>

        {/* CLUB STATS SECTION */}
        <div style={{
          background: '#1D1D1D',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: 'Montserrat, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '20px'
          }}>
            Stats with {clubInfo?.name || "Current Club"}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            <StatCard label="Average Rating" value={parseFloatNum(clubStats.ratingAve).toFixed(1)} />
            <StatCard label="Win Rate" value={clubStats.winRate ? `${clubStats.winRate}%` : "—"} />
            <StatCard label="Man of the Match" value={parseNum(clubStats.manOfTheMatch || clubStats.mom || clubStats.motm)} />
            <StatCard label="Clean Sheets" value={parseNum(clubStats.cleanSheets || clubStats.cleanSheetsGK)} />
            <StatCard label="Passes Made" value={parseNum(clubStats.passesMade).toLocaleString()} />
            <StatCard label="Pass Success" value={clubStats.passSuccessRate ? `${clubStats.passSuccessRate}%` : "—"} />
            <StatCard label="Tackles Made" value={parseNum(clubStats.tacklesMade)} />
            <StatCard label="Tackle Success" value={clubStats.tackleSuccessRate ? `${clubStats.tackleSuccessRate}%` : "—"} />
            <StatCard label="Shots" value={parseNum(clubStats.shots)} />
            <StatCard label="Shot Success" value={clubStats.shotSuccessRate ? `${clubStats.shotSuccessRate}%` : "—"} />
            <StatCard label="Red Cards" value={parseNum(clubStats.redCards)} />
            <StatCard label="Yellow Cards" value={parseNum(clubStats.yellowCards)} />
          </div>
        </div>

        {/* CAREER STATS SECTION */}
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
            marginBottom: '20px'
          }}>
            Career Totals (All Clubs)
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            <StatCard label="Total Games" value={parseNum(careerStats.gamesPlayed)} />
            <StatCard label="Total Goals" value={parseNum(careerStats.goals)} />
            <StatCard label="Total Assists" value={parseNum(careerStats.assists)} />
            <StatCard label="Average Rating" value={parseFloatNum(careerStats.ratingAve).toFixed(1)} />
            <StatCard label="Total MOTM" value={parseNum(careerStats.manOfTheMatch || careerStats.mom || careerStats.motm)} />
            <StatCard label="Win Rate" value={careerStats.winRate ? `${careerStats.winRate}%` : "—"} />
          </div>
        </div>
      </div>

      {/* Claim Player Modal */}
      <ClaimPlayerModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        playerName={playerName}
        personaId={personaId || ""}  // Pass empty string if no personaId (we use playerName as primary identifier)
        clubId={clubId}
        clubName={clubInfo?.name as string || "Unknown Club"}
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
