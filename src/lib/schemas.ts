/**
 * Zod schemas for EA Sports FC Pro Clubs API responses
 *
 * Why Zod? It validates data at runtime AND generates TypeScript types.
 * This is crucial because EA's API can return unexpected shapes.
 *
 * Learn more: https://zod.dev
 */

import { z } from "zod";

/**
 * Helper schemas for common EA API patterns
 */

// EA often returns numbers as strings ("123" instead of 123)
const numericString = z.string().transform((val) => {
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
});

const floatString = z.string().transform((val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
});

// Make numeric strings optional and default to 0
const optionalNumericString = numericString.optional().default("0");
const optionalFloatString = floatString.optional().default("0");

/**
 * Club Badge/Crest Schema
 */
const CustomKitSchema = z.object({
  selectedKitType: z.union([z.number(), z.string()]).optional(),
  crestAssetId: z.union([z.number(), z.string()]).optional(),
}).optional();

/**
 * Club Info Schema
 * Used for: /api/ea/club-info
 */
export const ClubInfoSchema = z.object({
  name: z.string().optional(),
  clubId: z.union([z.number(), z.string()]).optional(),
  teamId: z.union([z.number(), z.string()]).optional(),
  customKit: CustomKitSchema,
  // Add more fields as needed
}).passthrough(); // Allow extra fields we don't explicitly define

/**
 * Club Stats Schema
 * Used for: /api/ea/club-stats
 */
export const ClubStatsSchema = z.object({
  wins: optionalNumericString,
  losses: optionalNumericString,
  ties: optionalNumericString,
  draws: optionalNumericString,
  goals: optionalNumericString,
  goalsFor: optionalNumericString,
  goalsAgainst: optionalNumericString,
  ga: optionalNumericString,
  cleanSheets: optionalNumericString,
  cleansheets: optionalNumericString,
  skillRating: optionalNumericString,
  skillrating: optionalNumericString,
  bestDivision: z.union([z.number(), z.string()]).optional(),
  currentDivision: z.union([z.number(), z.string()]).optional(),
  leagueAppearances: optionalNumericString,
  leagueApps: optionalNumericString,
  gamesPlayedPlayoff: optionalNumericString,
  playoffApps: optionalNumericString,
  promotions: optionalNumericString,
  relegations: optionalNumericString,
  titlesWon: optionalNumericString,
  titles: optionalNumericString,
  wstreak: optionalNumericString,
  unbeatenstreak: optionalNumericString,
}).passthrough();

/**
 * Member/Player Schema
 * Used for: /api/ea/members
 */
export const MemberSchema = z.object({
  personaId: z.union([z.number(), z.string()]).optional(),
  id: z.union([z.number(), z.string()]).optional(),
  playerId: z.union([z.number(), z.string()]).optional(),
  personaName: z.string().optional(),
  name: z.string().optional(),
  memberName: z.string().optional(),
  gamesPlayed: optionalNumericString,
  appearances: optionalNumericString,
  apps: optionalNumericString,
  goals: optionalNumericString,
  assists: optionalNumericString,
  cleanSheets: optionalNumericString,
  cleansheet: optionalNumericString,
  cleanSheetsGK: optionalNumericString,
  cleanSheetsDef: optionalNumericString,
  saves: optionalNumericString,
  wins: optionalNumericString,
  gamesWon: optionalNumericString,
  losses: optionalNumericString,
  gamesLost: optionalNumericString,
  draws: optionalNumericString,
  gamesDraw: optionalNumericString,
  ratingAve: optionalFloatString,
  rating: optionalFloatString,
  pos: z.string().optional(),
  favoritePosition: z.string().optional(),
  proPos: z.string().optional(),
  proOverall: optionalNumericString,
  manOfTheMatch: optionalNumericString,
  mom: optionalNumericString,
  persona: z.object({
    id: z.union([z.number(), z.string()]).optional(),
  }).optional(),
}).passthrough();

export const MembersResponseSchema = z.union([
  z.array(MemberSchema),
  z.record(MemberSchema),
  z.object({
    members: z.array(MemberSchema),
  }),
  z.object({
    players: z.array(MemberSchema),
  }),
]).transform((data) => {
  // Normalize to always return an array
  if (Array.isArray(data)) return data;
  if ('members' in data && Array.isArray(data.members)) return data.members;
  if ('players' in data && Array.isArray(data.players)) return data.players;
  return Object.values(data);
});

/**
 * Match Schema
 * Used for: /api/ea/matches
 */
export const MatchClubSchema = z.object({
  clubId: z.union([z.number(), z.string()]).optional(),
  goals: optionalNumericString,
  score: optionalNumericString,
  gf: optionalNumericString,
  goalsAgainst: optionalNumericString,
  ga: optionalNumericString,
  result: z.string().optional(),
  matchType: z.string().optional(),
  wins: z.string().optional(),
  losses: z.string().optional(),
  ties: z.string().optional(),
  details: z.object({
    name: z.string().optional(),
    customKit: CustomKitSchema,
    teamId: z.union([z.number(), z.string()]).optional(),
  }).optional(),
  players: z.record(z.unknown()).optional(),
}).passthrough();

export const MatchSchema = z.object({
  matchId: z.union([z.number(), z.string()]).optional(),
  id: z.union([z.number(), z.string()]).optional(),
  timestamp: z.number().optional(),
  timeAgo: z.number().optional(),
  matchType: z.string().optional(),
  clubs: z.record(MatchClubSchema).optional(),
  players: z.record(z.unknown()).optional(),
}).passthrough();

export const MatchesResponseSchema = z.union([
  z.array(MatchSchema),
  z.object({}).passthrough(),
]).transform((data) => {
  if (Array.isArray(data)) return data;
  return [];
});

/**
 * Search/Leaderboard Schema
 * Used for: /api/ea/search-clubs, /api/ea/club-leaderboard
 */
export const LeaderboardClubSchema = z.object({
  clubId: z.union([z.number(), z.string()]),
  name: z.string().optional(),
  rank: optionalNumericString,
  skillRating: optionalNumericString,
  currentDivision: z.union([z.number(), z.string()]).optional(),
  bestDivision: z.union([z.number(), z.string()]).optional(),
}).passthrough();

export const LeaderboardResponseSchema = z.union([
  z.array(LeaderboardClubSchema),
  z.record(LeaderboardClubSchema),
]).transform((data) => {
  if (Array.isArray(data)) return data;
  return Object.values(data);
});

/**
 * TypeScript types generated from Zod schemas
 * These are automatically inferred and stay in sync with the schemas
 */
export type ClubInfo = z.infer<typeof ClubInfoSchema>;
export type ClubStats = z.infer<typeof ClubStatsSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type LeaderboardClub = z.infer<typeof LeaderboardClubSchema>;
