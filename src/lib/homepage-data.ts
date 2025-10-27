/**
 * Homepage Data - Random Clubs & Players
 *
 * Uses bundled club IDs and fetches real data from EA API.
 * Uses daily randomization for consistent display throughout the day.
 * Includes retry logic to ensure reliable data fetching.
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
 * Shuffle array using Fisher-Yates algorithm with day-based seed
 * Changes once per day instead of every hour for more stable results
 */
function shuffleWithDailySeed<T>(array: T[], seedOffset = 0): T[] {
  const arr = [...array];
  // Use day-based seed instead of hour-based for more stability
  const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

  // Simple seeded random using day + offset
  let seed = currentDay + seedOffset;
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
    console.log(`[Homepage] Fetching club info for ${clubId}`);
    const infoRes = await fetch(infoUrl, {
      headers,
      cache: 'no-store' // Always fetch fresh data to align with daily rotation
    });

    if (!infoRes.ok) {
      console.error(`[Homepage] Club info fetch failed for ${clubId}: ${infoRes.status}`);
      return null;
    }

    const infoData = await infoRes.json();
    const clubInfo = infoData[clubId];
    if (!clubInfo) {
      console.error(`[Homepage] No club info found for ${clubId}`);
      return null;
    }

    // Fetch overall stats (for skillRating)
    const statsUrl = `${EA_BASE}/fc/clubs/overallStats?platform=${PLATFORM}&clubIds=${clubId}`;
    const statsRes = await fetch(statsUrl, {
      headers,
      cache: 'no-store' // Always fetch fresh data to align with daily rotation
    });

    if (!statsRes.ok) {
      console.warn(`[Homepage] Club stats fetch failed for ${clubId}, using info only`);
      // Return with just basic info, no stats
      return clubInfo;
    }

    const statsText = await statsRes.text();
    if (!statsText.trim()) {
      console.warn(`[Homepage] Empty stats response for ${clubId}`);
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

    console.log(`[Homepage] Successfully fetched club ${clubId}: ${clubInfo.clubName || clubInfo.name}`);

    // Combine info and stats
    return {
      ...clubInfo,
      ...clubStats
    };
  } catch (error) {
    console.error(`[Homepage] Error fetching club ${clubId}:`, error);
    return null;
  }
}

/**
 * Fetch club members from EA API
 */
async function fetchClubMembers(clubId: string): Promise<any[]> {
  try {
    const url = `${EA_BASE}/fc/members/career/stats?platform=${PLATFORM}&clubId=${clubId}`;
    console.log(`[Homepage] Fetching members for club ${clubId}`);
    const res = await fetch(url, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "referer": "https://www.ea.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: 'no-store' // Always fetch fresh data to align with daily rotation
    });

    if (!res.ok) {
      console.error(`[Homepage] Members fetch failed for club ${clubId}: ${res.status}`);
      return [];
    }

    const data = await res.json();

    // Handle various response shapes
    let members: any[] = [];
    if (Array.isArray(data)) {
      members = data;
    } else if (data.members && Array.isArray(data.members)) {
      members = data.members;
    } else if (data.data && Array.isArray(data.data)) {
      members = data.data;
    }

    console.log(`[Homepage] Found ${members.length} members for club ${clubId}`);
    return members;
  } catch (error) {
    console.error(`[Homepage] Error fetching members for club ${clubId}:`, error);
    return [];
  }
}

/**
 * Get 5 random clubs for homepage with full data
 * Uses daily rotation and retry logic for reliability
 */
export async function getRandomClubs(): Promise<RandomClub[]> {
  const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  console.log(`[Homepage] getRandomClubs called - Day seed: ${currentDay}`);

  const clubIds = getClubIds();

  if (clubIds.length === 0) {
    console.error('[Homepage] No club IDs available!');
    return [];
  }

  console.log(`[Homepage] Total club IDs available: ${clubIds.length}`);

  // Shuffle based on current day (not hour) for more stability
  const shuffled = shuffleWithDailySeed(clubIds, 0);

  // Try more clubs to ensure we get at least 5 working ones
  const candidateIds = shuffled.slice(0, Math.min(15, shuffled.length));
  console.log(`[Homepage] Trying ${candidateIds.length} candidate clubs: ${candidateIds.slice(0, 5).join(', ')}...`);

  // Fetch club info with error handling
  const results: RandomClub[] = [];

  for (const clubId of candidateIds) {
    // Stop if we already have 5 clubs
    if (results.length >= 5) break;

    try {
      const clubInfo = await fetchClubInfo(clubId);
      if (!clubInfo) continue;

      // Parse skillRating from string to number
      const skillRating = parseInt(clubInfo.skillRating || clubInfo.rating || '0', 10);

      // Skip clubs with no rating
      if (skillRating === 0) {
        console.warn(`[Homepage] Skipping club ${clubId} - no skill rating`);
        continue;
      }

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
      } else {
        division = 'Div 5';
      }

      results.push({
        clubId,
        name: clubInfo.clubName || clubInfo.name || `Club ${clubId}`,
        division,
        skillRating,
        badgeUrl: getClubBadgeUrl(clubInfo)
      });
    } catch (error) {
      // Log and continue to next club
      console.error(`[Homepage] Failed to fetch club ${clubId}:`, error);
      continue;
    }
  }

  console.log(`[Homepage] getRandomClubs completed - Found ${results.length} clubs`);
  return results;
}

/**
 * Get 5 random players for homepage with full data
 * Uses different clubs than the teams column with retry logic
 */
export async function getRandomPlayers(): Promise<RandomPlayer[]> {
  const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  console.log(`[Homepage] getRandomPlayers called - Day seed: ${currentDay}`);

  const clubIds = getClubIds();

  if (clubIds.length === 0) {
    console.error('[Homepage] No club IDs available for players!');
    return [];
  }

  // Shuffle based on current day (with different seed offset from clubs)
  const shuffled = shuffleWithDailySeed(clubIds, 999);

  // Take different clubs (offset by 15 to avoid overlap with teams)
  // Try more candidates to ensure we get 5 working players
  const candidateIds = shuffled.slice(15, Math.min(30, shuffled.length));
  console.log(`[Homepage] Trying ${candidateIds.length} candidate clubs for players: ${candidateIds.slice(0, 5).join(', ')}...`);

  const results: RandomPlayer[] = [];

  // Seed for picking random player within each club
  let playerSeed = currentDay + 12345;
  const playerRandom = () => {
    playerSeed = (playerSeed * 9301 + 49297) % 233280;
    return playerSeed / 233280;
  };

  for (const clubId of candidateIds) {
    // Stop if we already have 5 players
    if (results.length >= 5) break;

    try {
      const members = await fetchClubMembers(clubId);
      if (members.length === 0) {
        console.warn(`[Homepage] No members found for club ${clubId}`);
        continue;
      }

      // Pick random player from this club
      const randomIndex = Math.floor(playerRandom() * members.length);
      const player = members[randomIndex];

      // Extract player data (handle various response shapes)
      const playerName = player.name || player.playerName || player.playername || 'Unknown';
      const position = player.position || player.pos || player.favoritePosition || 'ANY';
      const avgRating = parseFloat(player.ratingAve || player.avgRating || player.rating || '0');

      // Skip players with no rating
      if (avgRating === 0) {
        console.warn(`[Homepage] Skipping player ${playerName} from club ${clubId} - no rating`);
        continue;
      }

      console.log(`[Homepage] Added player: ${playerName} (${position}) - Rating: ${avgRating.toFixed(1)}`);

      results.push({
        clubId,
        playerName,
        position,
        mainStat: getMainStatForPosition(player),
        avgRating,
        url: `/player/${clubId}/${encodeURIComponent(playerName)}?platform=${PLATFORM}`,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=80&background=667eea&color=fff&bold=true`
      });
    } catch (error) {
      // Log and continue to next club
      console.error(`[Homepage] Failed to fetch players for club ${clubId}:`, error);
      continue;
    }
  }

  console.log(`[Homepage] getRandomPlayers completed - Found ${results.length} players`);
  return results;
}
