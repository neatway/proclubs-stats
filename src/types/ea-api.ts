// TypeScript types for EA Pro Clubs API responses

export interface ClubInfo {
  clubId: string;
  name: string;
  region?: string;
  regionId?: number;
  teamId?: string;
  customKit?: {
    crest?: string;
    stadName?: string;
    kitId?: string;
    seasonalTeamId?: string;
    seasonalKitId?: string;
    selectedKitType?: string;
    customKitId?: string;
    customAwayKitId?: string;
    customThirdKitId?: string;
    customKeeperKitId?: string;
    kitColor1?: string;
    kitColor2?: string;
    kitColor3?: string;
    kitColor4?: string;
    kitAColor1?: string;
    kitAColor2?: string;
    kitAColor3?: string;
    kitAColor4?: string;
  };
  wins?: number;
  losses?: number;
  draws?: number;
  ties?: number;
  goals?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  ga?: number;
  recentMatch0?: string;
  recentMatch1?: string;
  recentMatch2?: string;
  recentMatch3?: string;
  recentMatch4?: string;
  cleanSheets?: number;
  cleansheets?: number;
  divisionNumber?: number;
  divisionPoints?: number;
  promotionPoints?: number;
  skillRating?: number;
  skillrating?: number;
  reputationtier?: number;
  titlesWon?: number;
  titles?: number;
  rank?: number;
  bestDivision?: number;
  leagueAppearances?: number;
  leagueApps?: number;
  gamesPlayedPlayoff?: number;
  playoffApps?: number;
  gamesPlayed?: number;
  promotions?: number;
  relegations?: number;
  wstreak?: number;
  unbeatenstreak?: number;
  lastMatch0?: string;
  lastMatch1?: string;
  lastMatch2?: string;
  lastMatch3?: string;
  lastMatch4?: string;
  lastMatch5?: string;
  lastMatch6?: string;
  lastMatch7?: string;
  lastMatch8?: string;
  lastMatch9?: string;
  lastOpponent0?: string;
  lastOpponent1?: string;
  lastOpponent2?: string;
  lastOpponent3?: string;
  lastOpponent4?: string;
  lastOpponent5?: string;
  lastOpponent6?: string;
  lastOpponent7?: string;
  lastOpponent8?: string;
  lastOpponent9?: string;
  finishesInDivision1Group1?: string;
  finishesInDivision2Group1?: string;
  finishesInDivision3Group1?: string;
  finishesInDivision4Group1?: string;
  finishesInDivision5Group1?: string;
  finishesInDivision6Group1?: string;
  [key: string]: any;
}

export interface PlayerStats {
  appearances?: number;
  gamesPlayed?: number;
  apps?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  cleanSheetsDef?: number;
  cleanSheetsGK?: number;
  cleansheet?: number;
  saves?: number;
  wins?: number;
  gamesWon?: number;
  losses?: number;
  gamesLost?: number;
  draws?: number;
  gamesDraw?: number;
  winRate?: number;
  mom?: number; // man of the match
  motm?: number; // man of the match (alternate)
  manOfTheMatch?: number;
  yellowCards?: number;
  redCards?: number;
  passSuccess?: number;
  passesMade?: number;
  passSuccessRate?: number;
  tackleSuccess?: number;
  tacklesMade?: number;
  tackleSuccessRate?: number;
  shotSuccessRate?: number;
  pos?: string; // position
  favoritePosition?: string;
  ratingAve?: number;
  rating?: number;
  proName?: string;
  proPos?: string;
  proStyle?: string;
  proHeight?: string;
  proNationality?: string;
  proOverall?: string;
  proOverallStr?: string;
  prevGoals?: string;
  prevGoals1?: string;
  prevGoals2?: string;
  prevGoals3?: string;
  prevGoals4?: string;
  prevGoals5?: string;
  prevGoals6?: string;
  prevGoals7?: string;
  prevGoals8?: string;
  prevGoals9?: string;
  prevGoals10?: string;
  [key: string]: any;
}

export interface MemberData {
  personaId?: string;
  id?: string;
  playerId?: string;
  name?: string;
  personaName?: string;
  memberName?: string;
  clubStats?: PlayerStats;
  clubTotalStats?: PlayerStats;
  careerStats?: PlayerStats;
  careerTotalStats?: PlayerStats;
  [key: string]: any;
}

export interface Match {
  matchId?: string;
  timestamp?: number;
  timeAgo?: string;
  clubs?: {
    [clubId: string]: {
      clubId?: string;
      name?: string;
      goals?: number;
      goalsAgainst?: number;
      result?: string; // "win" | "loss" | "draw"
      score?: number;
      scoreString?: string;
      losses?: string;
      draws?: string;
      wins?: string;
      ga?: string;
      gf?: string;
      players?: {
        [playerId: string]: {
          playerId?: string;
          playerName?: string;
          goals?: number;
          assists?: number;
          rating?: number;
          pos?: string;
          [key: string]: any;
        };
      };
      [key: string]: any;
    };
  };
  matchType?: string; // "league" | "friendly"
  [key: string]: any;
}

export interface PlayerCareerStats {
  personaId?: string;
  name?: string;
  proName?: string;
  totalStats?: PlayerStats;
  careerStats?: PlayerStats;
  clubs?: {
    [clubId: string]: {
      clubId?: string;
      clubName?: string;
      stats?: PlayerStats;
      [key: string]: any;
    };
  };
  [key: string]: any;
}

export interface SearchResult {
  clubId: string;
  name: string;
  platform?: string;
  rank?: number;
  skillRating?: number;
  [key: string]: any;
}

export interface NormalizedMember {
  personaId?: string;
  name: string;
  appearances?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  saves?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  ratingAve?: number;
  pos?: string;
  proPos?: string;
  [key: string]: any;
}
