/**
 * Homepage Data - Random Clubs & Players
 *
 * Uses bundled club IDs and fetches real data from EA API.
 * Uses hourly randomization for consistent display within each hour.
 */

import { getClubBadgeUrl } from './utils';
import { CLUB_IDS } from './club-ids';

const EA_BASE = "https://proclubs.ea.com/api";
const PLATFORM = "common-gen5";

interface RandomClub {
  clubId: string;
  name: string;
  division: string;
  skillRating: number;
  badgeUrl: string;
}

interface RandomPlayer {
  clubId: string;
  playerName: string;
  position: string;
  mainStat: {
    icon: string;
    label: string;
    value: string;
  };
  avgRating: number;
  url: string;
  avatarUrl: string;
}

/**
 * Shuffle array using Fisher-Yates algorithm with hour-based seed
 */
function shuffleWithHourSeed<T>(array: T[]): T[] {
  const arr = [...array];
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));

  // Simple seeded random using hour
  let seed = currentHour;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * Get club IDs from bundled data
 */
function getClubIds(): string[] {
  return CLUB_IDS;
}

/**
 * Format division display
 */
function formatDivision(division: string | number): string {
  const div = String(division);
  switch (div) {
    case '1': return 'Elite';
    case '2': return 'Div 1';
    case '3': return 'Div 2';
    case '4': return 'Div 3';
    case '5': return 'Div 4';
    case '6': return 'Div 5';
    default: return `Div ${div}`;
  }
}

/**
 * Get position-specific main stat
 */
function getMainStatForPosition(player: any) {
  // Check all possible position field names from EA API
  const pos = (player.position || player.pos || player.favoritePosition || player.proPos || '').toLowerCase();

  // FORWARDS → GOALS
  if (pos === 'forward' || ['ST', 'CF', 'LW', 'RW'].includes(pos.toUpperCase())) {
    return {
      icon: '⚽',
      label: 'Goals',
      value: String(player.goals || player.stats?.goals || 0)
    };
  }

  // MIDFIELDERS → ASSISTS
  if (pos === 'midfielder' || ['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos.toUpperCase())) {
    return {
      icon: '🅰️',
      label: 'Assists',
      value: String(player.assists || player.stats?.assists || 0)
    };
  }

  // DEFENDERS → TACKLES
  if (pos === 'defender' || ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos.toUpperCase())) {
    return {
      icon: '🛡️',
      label: 'Tackles',
      value: String(player.tacklesMade || player.stats?.tacklesMade || 0)
    };
  }

  // GOALKEEPER → CLEAN SHEETS
  if (pos === 'goalkeeper' || pos.toUpperCase() === 'GK') {
    return {
      icon: '🧤',
      label: 'Clean Sheets',
      value: String(player.cleanSheets || player.stats?.cleanSheets || 0)
    };
  }

  // Default fallback to goals
  return {
    icon: '⚽',
    label: 'Goals',
    value: String(player.goals || 0)
  };
}

/**
 * Fetch club data from EA API
 * Combines info and overallStats endpoints to get complete data
 */
async function fetchClubInfo(clubId: string): Promise<any> {
  try {
    const headers = {
      "accept": "application/json, text/plain, */*",
      "referer": "https://www.ea.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    // Fetch club info (for name)
    const infoUrl = `${EA_BASE}/fc/clubs/info?platform=${PLATFORM}&clubIds=${clubId}`;
    const infoRes = await fetch(infoUrl, {
      headers,
      next: { revalidate: 3600 }
    });

    if (!infoRes.ok) return null;

    const infoData = await infoRes.json();
    const clubInfo = infoData[clubId];
    if (!clubInfo) return null;

    // Fetch overall stats (for skillRating)
    const statsUrl = `${EA_BASE}/fc/clubs/overallStats?platform=${PLATFORM}&clubIds=${clubId}`;
    const statsRes = await fetch(statsUrl, {
      headers,
      next: { revalidate: 3600 }
    });

    if (!statsRes.ok) {
      // Return with just basic info, no stats
      return clubInfo;
    }

    const statsText = await statsRes.text();
    if (!statsText.trim()) {
      return clubInfo;
    }

    const statsData = JSON.parse(statsText);

    // Stats endpoint returns array format
    let clubStats = null;
    if (Array.isArray(statsData) && statsData.length > 0) {
      clubStats = statsData[0];
    } else if (statsData[clubId]) {
      clubStats = statsData[clubId];
    }

    // Combine info and stats
    return {
      ...clubInfo,
      ...clubStats
    };
  } catch (error) {
    console.error(`Error fetching club ${clubId}:`, error);
    return null;
  }
}

/**
 * Fetch club members from EA API
 */
async function fetchClubMembers(clubId: string): Promise<any[]> {
  try {
    const url = `${EA_BASE}/fc/members/career/stats?platform=${PLATFORM}&clubId=${clubId}`;
    const res = await fetch(url, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "referer": "https://www.ea.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) return [];
    const data = await res.json();

    // Handle various response shapes
    if (Array.isArray(data)) return data;
    if (data.members && Array.isArray(data.members)) return data.members;
    if (data.data && Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error(`Error fetching members for club ${clubId}:`, error);
    return [];
  }
}

/**
 * Get 5 random clubs for homepage with full data
 */
export async function getRandomClubs(): Promise<RandomClub[]> {
  const clubIds = getClubIds();

  if (clubIds.length === 0) {
    return [];
  }

  // Shuffle based on current hour
  const shuffled = shuffleWithHourSeed(clubIds);

  // Take up to 5 clubs
  const selectedIds = shuffled.slice(0, Math.min(5, shuffled.length));

  // Fetch club info for each
  const clubPromises = selectedIds.map(async (clubId) => {
    const clubInfo = await fetchClubInfo(clubId);
    if (!clubInfo) return null;

    // Parse skillRating from string to number
    const skillRating = parseInt(clubInfo.skillRating || clubInfo.rating || '0', 10);

    // Calculate division from skillRating (approximate FC 25 ranges)
    let division = 'Unranked';
    if (skillRating >= 2000) {
      division = 'Elite';
    } else if (skillRating >= 1800) {
      division = 'Div 1';
    } else if (skillRating >= 1600) {
      division = 'Div 2';
    } else if (skillRating >= 1400) {
      division = 'Div 3';
    } else if (skillRating >= 1200) {
      division = 'Div 4';
    } else if (skillRating > 0) {
      division = 'Div 5';
    }

    return {
      clubId,
      name: clubInfo.clubName || clubInfo.name || `Club ${clubId}`,
      division,
      skillRating,
      badgeUrl: getClubBadgeUrl(clubInfo)
    };
  });

  const results = await Promise.all(clubPromises);
  return results.filter((club): club is RandomClub => club !== null);
}

/**
 * Get 5 random players for homepage with full data
 * Uses different clubs than the teams column
 */
export async function getRandomPlayers(): Promise<RandomPlayer[]> {
  const clubIds = getClubIds();

  if (clubIds.length === 0) {
    return [];
  }

  // Shuffle based on current hour (with different seed offset)
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  let seed = currentHour + 999; // Different seed from clubs
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const arr = [...clubIds];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Take different clubs (offset by 5 to avoid overlap with teams)
  const selectedIds = arr.slice(5, Math.min(10, arr.length));

  // Fetch one random player from each club
  const playerPromises = selectedIds.map(async (clubId) => {
    const members = await fetchClubMembers(clubId);
    if (members.length === 0) return null;

    // Pick random player from this club
    const randomIndex = Math.floor(seededRandom() * members.length);
    const player = members[randomIndex];

    // Extract player data (handle various response shapes)
    const playerName = player.name || player.playerName || player.playername || 'Unknown';
    const position = player.position || player.pos || player.favoritePosition || 'ANY';
    const avgRating = parseFloat(player.ratingAve || player.avgRating || player.rating || '0');

    return {
      clubId,
      playerName,
      position,
      mainStat: getMainStatForPosition(player),
      avgRating,
      url: `/player/${clubId}/${encodeURIComponent(playerName)}?platform=${PLATFORM}`,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=80&background=667eea&color=fff&bold=true`
    };
  });

  const results = await Promise.all(playerPromises);
  return results.filter((player): player is RandomPlayer => player !== null);
}
