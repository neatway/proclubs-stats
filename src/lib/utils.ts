// Utility functions for EA API data handling

import { NormalizedMember } from "@/types/ea-api";

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
  data: any,
  scope: "club" | "career" = "club"
): NormalizedMember[] {
  const pick = (row: any): NormalizedMember => {
    // EA returns flat structure with direct fields, not nested stats objects
    const stats = row; // Use the row directly since EA doesn't nest stats

    // Parse string numbers to actual numbers
    const parseNum = (val: any) => {
      if (val === null || val === undefined || val === "") return undefined;
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return isNaN(num) ? undefined : num;
    };

    const parseFloatNum = (val: any) => {
      if (val === null || val === undefined || val === "") return undefined;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    };

    return {
      personaId: String(
        row?.personaId ?? row?.id ?? row?.playerId ?? row?.persona?.id ?? ""
      ) || undefined,
      name: row?.personaName || row?.name || row?.memberName || "Unknown",
      appearances: parseNum(row?.gamesPlayed ?? row?.appearances ?? row?.apps),
      goals: parseNum(row?.goals),
      assists: parseNum(row?.assists),
      cleanSheets: parseNum(row?.cleanSheets ?? row?.cleansheet),
      saves: parseNum(row?.saves),
      wins: parseNum(row?.wins ?? row?.gamesWon),
      losses: parseNum(row?.losses ?? row?.gamesLost),
      draws: parseNum(row?.draws ?? row?.gamesDraw),
      ratingAve: parseFloatNum(row?.ratingAve ?? row?.rating),
      pos: row?.pos || row?.favoritePosition,
      proPos: row?.proPos,
      ...row,
    };
  };

  if (!data) return [];
  if (Array.isArray(data)) return data.map(pick);

  if (typeof data === "object") {
    const possible = (data as any).members || (data as any).players || data;
    if (Array.isArray(possible)) return possible.map(pick);
    return Object.values(possible).map(pick);
  }
  return [];
}

/**
 * Extract club info from EA API response
 */
export function extractClubInfo(data: any, clubId: string) {
  if (!data) return null;

  // Try different possible structures
  if (data[clubId]) return data[clubId];
  if (Array.isArray(data) && data.length > 0) return data[0];
  if (data.club) return data.club;

  return data;
}

/**
 * Normalize match data
 */
export function normalizeMatch(match: any) {
  if (!match) return null;

  const clubs = match.clubs || {};
  const clubIds = Object.keys(clubs);

  return {
    matchId: match.matchId || match.id,
    timestamp: match.timestamp || match.timeAgo,
    matchType: match.matchType || "unknown",
    clubs: clubIds.map((clubId) => {
      const club = clubs[clubId];
      return {
        clubId,
        name: club?.name || club?.clubName,
        goals: club?.goals ?? club?.score ?? club?.gf,
        goalsAgainst: club?.goalsAgainst ?? club?.ga,
        result: club?.result,
        players: club?.players ? Object.values(club.players) : [],
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
export function parseIntSafe(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  return isNaN(num) ? 0 : num;
}

/**
 * Get club badge URL based on selectedKitType
 * Uses EA Sports FC 24 CDN URL pattern
 * selectedKitType: 1 = custom badge (use crestAssetId), 0 = real team badge (use teamId)
 */
export function getClubBadgeUrl(clubData: any): string {
  const fallbackUrl = "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/notfound-crest.png";

  if (!clubData) return fallbackUrl;

  const customKit = clubData.customKit;
  const selectedKitType = customKit?.selectedKitType;

  let badgeId;
  if (selectedKitType === 1 || selectedKitType === "1") {
    // Custom badge - use crestAssetId
    badgeId = customKit?.crestAssetId;
  } else {
    // Real team badge - use teamId
    badgeId = clubData.teamId;
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
