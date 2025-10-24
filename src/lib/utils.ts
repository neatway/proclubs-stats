// Utility functions for EA API data handling

import { NormalizedMember } from "@/types/ea-api";
import { safeInt, safeNumber } from "./ea-type-guards";

/**
 * Safely parse JSON from a Response, handling empty bodies
 */
export async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!text.trim()) return null;
  if (ct.includes("application/json")) return JSON.parse(text);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned non-JSON");
  }
}

/**
 * Normalize various EA member shapes into one consistent list.
 * scope = "club" shows only club stats if present; "career" shows career totals.
 */
export function normalizeMembers(
  data: unknown
): NormalizedMember[] {
  const pick = (row: unknown): NormalizedMember => {
    const member = row as Record<string, unknown>;
    // EA returns flat structure with direct fields, not nested stats objects

    // Parse string numbers to actual numbers
    const parseNum = (val: unknown) => {
      const num = safeInt(val);
      return num === 0 ? undefined : num;
    };

    const parseFloatNum = (val: unknown) => {
      const num = safeNumber(val);
      return num === 0 ? undefined : num;
    };

    const persona = member?.persona as Record<string, unknown> | undefined;

    return {
      personaId: String(
        member?.personaId ?? member?.id ?? member?.playerId ?? persona?.id ?? ""
      ) || undefined,
      name: (member?.personaName ?? member?.name ?? member?.memberName ?? "Unknown") as string,
      appearances: parseNum(member?.gamesPlayed ?? member?.appearances ?? member?.apps),
      goals: parseNum(member?.goals),
      assists: parseNum(member?.assists),
      cleanSheets: parseNum(member?.cleanSheets ?? member?.cleansheet),
      saves: parseNum(member?.saves),
      wins: parseNum(member?.wins ?? member?.gamesWon),
      losses: parseNum(member?.losses ?? member?.gamesLost),
      draws: parseNum(member?.draws ?? member?.gamesDraw),
      ratingAve: parseFloatNum(member?.ratingAve ?? member?.rating),
      pos: (member?.pos ?? member?.favoritePosition) as string | undefined,
      proPos: member?.proPos as string | undefined,
      ...member,
    };
  };

  if (!data) return [];
  if (Array.isArray(data)) return data.map(pick);

  if (typeof data === "object") {
    const dataObj = data as Record<string, unknown>;
    const possible = dataObj.members || dataObj.players || data;
    if (Array.isArray(possible)) return possible.map(pick);
    return Object.values(possible as Record<string, unknown>).map(pick);
  }
  return [];
}

/**
 * Extract club info from EA API response
 */
export function extractClubInfo(data: unknown, clubId: string) {
  if (!data) return null;

  const dataObj = data as Record<string, unknown>;
  // Try different possible structures
  if (dataObj[clubId]) return dataObj[clubId];
  if (Array.isArray(data) && data.length > 0) return data[0];
  if (dataObj.club) return dataObj.club;

  return data;
}

/**
 * Normalize match data
 */
export function normalizeMatch(match: unknown) {
  if (!match) return null;

  const matchObj = match as Record<string, unknown>;
  const clubs = (matchObj.clubs as Record<string, Record<string, unknown>>) || {};
  const clubIds = Object.keys(clubs);

  return {
    matchId: matchObj.matchId || matchObj.id,
    timestamp: matchObj.timestamp || matchObj.timeAgo,
    matchType: matchObj.matchType || "unknown",
    clubs: clubIds.map((clubId) => {
      const club = clubs[clubId];
      return {
        clubId,
        name: club?.name || club?.clubName,
        goals: club?.goals ?? club?.score ?? club?.gf,
        goalsAgainst: club?.goalsAgainst ?? club?.ga,
        result: club?.result,
        players: club?.players ? Object.values(club.players as Record<string, unknown>) : [],
      };
    }),
  };
}

/**
 * Format a result badge (W/L/D)
 */
export function formatResult(result: string | undefined): string {
  if (!result) return "-";
  const r = result.toLowerCase();
  if (r.includes("win") || r === "w") return "W";
  if (r.includes("loss") || r === "l") return "L";
  if (r.includes("draw") || r === "d") return "D";
  return result;
}

/**
 * Get color class for result badge
 */
export function getResultColor(result: string | undefined): string {
  const r = formatResult(result);
  if (r === "W") return "bg-green-100 text-green-800";
  if (r === "L") return "bg-red-100 text-red-800";
  if (r === "D") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-600";
}

/**
 * Format timestamp to readable date
 * EA API returns UNIX timestamps in SECONDS, not milliseconds
 */
export function formatDate(timestamp: number | string | undefined): string {
  if (!timestamp) return "-";
  try {
    const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
    // Multiply by 1000 to convert seconds to milliseconds
    const date = new Date(ts * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(timestamp);
  }
}

/**
 * Get reputation tier name from numeric tier
 * Tier 1 = "Emerging Stars" is confirmed from EA
 * Tiers 2-6 are placeholders and need verification from EA's website
 */
export function getReputationName(tier: string | number | undefined): string {
  const reputationTiers: Record<string, string> = {
    "1": "Emerging Stars",
    "2": "Well Known",      // TODO: Verify from EA's Pro Clubs pages
    "3": "Popular",         // TODO: Verify from EA's Pro Clubs pages
    "4": "Renowned",        // TODO: Verify from EA's Pro Clubs pages
    "5": "Elite",           // TODO: Verify from EA's Pro Clubs pages
    "6": "Legendary"        // TODO: Verify from EA's Pro Clubs pages
  };

  if (!tier) return "Unknown";
  const tierStr = String(tier);
  return reputationTiers[tierStr] || "Unknown";
}

/**
 * Parse numeric string to integer
 */
export function parseIntSafe(value: unknown): number {
  return safeInt(value);
}

/**
 * Get club badge URL based on selectedKitType
 * Uses EA Sports FC 24 CDN URL pattern
 * selectedKitType: 1 = custom badge (use crestAssetId), 0 = real team badge (use teamId)
 */
export function getClubBadgeUrl(clubData: unknown): string {
  const fallbackUrl = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";

  if (!clubData) return fallbackUrl;

  const club = clubData as Record<string, unknown>;
  const customKit = club.customKit as Record<string, unknown> | undefined;
  const selectedKitType = customKit?.selectedKitType;

  let badgeId;
  if (selectedKitType === 1 || selectedKitType === "1") {
    // Custom badge - use crestAssetId
    badgeId = customKit?.crestAssetId;
  } else {
    // Real team badge - use teamId
    badgeId = club.teamId;
  }

  if (!badgeId) return fallbackUrl;

  return `https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${badgeId}.png`;
}

/**
 * Get division badge URL from division number (1-6)
 */
export function getDivisionBadgeUrl(division: string | number | undefined): string | null {
  if (!division) return null;
  return `https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/divisioncrest${division}.png`;
}

/**
 * Get division name from division number
 */
export function getDivisionName(division: string | number | undefined): string {
  const divisionMap: Record<string, string> = {
    "1": "Elite",
    "2": "Division 1",
    "3": "Division 2",
    "4": "Division 3",
    "5": "Division 4",
    "6": "Division 5"
  };

  if (!division) return "Unknown";
  const divStr = String(division);
  return divisionMap[divStr] || "Unknown";
}

/**
 * Capitalize first letter of a string (for positions, etc.)
 */
export function capitalizeFirst(str: string | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get user's locale from browser
 */
export function getUserLocale(): string {
  if (typeof window === 'undefined') return 'en-US'; // SSR fallback
  return navigator.language || (navigator.languages && navigator.languages[0]) || 'en-US';
}

/**
 * Get user's country code from browser locale
 */
export function getUserCountry(): string {
  const locale = getUserLocale();
  // Extract country code (e.g., 'en-US' -> 'US', 'en-GB' -> 'GB')
  const countryCode = locale.split('-')[1] || 'US';
  return countryCode.toUpperCase();
}

/**
 * Format height based on viewer's locale (not player's nationality)
 * Shows feet/inches for US, UK, GB viewers; cm for everyone else
 */
export function formatHeightForViewer(heightCm: unknown): string {
  const height = safeInt(heightCm);
  if (!height) return "—";

  const userCountry = getUserCountry();
  const imperialCountries = ['US', 'GB', 'UK', 'LR', 'MM']; // USA, UK, Liberia, Myanmar

  if (imperialCountries.includes(userCountry)) {
    // Convert to feet and inches for imperial viewers
    const totalInches = height / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  } else {
    // Show cm for metric viewers
    return `${height} cm`;
  }
}
