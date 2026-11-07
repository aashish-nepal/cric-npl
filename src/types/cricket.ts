/** Core cricket domain types. Framework-free and shared by both data backends. */

export type ID = string;

export type SeasonStatus = "upcoming" | "active" | "completed";
export type MatchStatus = "scheduled" | "live" | "completed" | "abandoned" | "cancelled";
export type TossDecision = "bat" | "bowl";
export type PlayerRole = "batter" | "bowler" | "all_rounder" | "wicketkeeper";
export type BattingStyle = "Right-hand bat" | "Left-hand bat";
export type BowlingStyle =
  | "Right-arm fast"
  | "Right-arm medium"
  | "Right-arm offbreak"
  | "Right-arm legbreak"
  | "Left-arm fast"
  | "Left-arm medium"
  | "Left-arm orthodox"
  | "Left-arm wrist spin"
  | "None";

export type ExtraType = "wide" | "no_ball" | "bye" | "leg_bye" | "penalty";
export type WicketType =
  | "bowled"
  | "caught"
  | "caught_and_bowled"
  | "lbw"
  | "run_out"
  | "stumped"
  | "hit_wicket"
  | "retired_hurt"
  | "obstructing_field"
  | "timed_out";

export type ArticleStatus = "draft" | "scheduled" | "published" | "archived";
export type PollStatus = "open" | "closed";
export type UserRole = "user" | "moderator" | "author" | "editor" | "scorer" | "admin" | "super_admin";

export interface Tournament {
  id: ID;
  name: string;
  slug: string;
  format: string;
  country: string;
  description: string;
}

export interface SeasonSettings {
  pointsWin: number;
  pointsTie: number;
  pointsNoResult: number;
  ballsPerInnings: number;
  /** Official short-form convention: an all-out side is treated as having faced its full quota for NRR. */
  allOutUsesFullQuota: boolean;
}

export interface Season {
  id: ID;
  tournamentId: ID;
  name: string;
  slug: string;
  year: number;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  description: string;
  settings: SeasonSettings;
  createdAt: string;
}

export interface Team {
  id: ID;
  name: string;
  slug: string;
  shortName: string;
  logoUrl: string | null;
  primaryColor: string;
  description: string;
  homeCity: string;
  active: boolean;
}

export interface Player {
  id: ID;
  fullName: string;
  slug: string;
  profileImage: string | null;
  dateOfBirth: string | null;
  nationality: string;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  playingRole: PlayerRole;
  biography: string;
  isDemo?: boolean;
}

export interface SquadMember {
  id: ID;
  seasonId: ID;
  teamId: ID;
  playerId: ID;
  jerseyNumber: number | null;
  captain: boolean;
  viceCaptain: boolean;
}

export interface Venue {
  id: ID;
  name: string;
  slug: string;
  city: string;
  country: string;
  capacity: number | null;
  description: string;
}

export interface Match {
  id: ID;
  seasonId: ID;
  tournamentId: ID;
  matchNumber: number;
  slug: string;
  teamAId: ID;
  teamBId: ID;
  venueId: ID;
  scheduledAt: string;
  status: MatchStatus;
  tossWinnerId: ID | null;
  tossDecision: TossDecision | null;
  winnerId: ID | null;
  resultSummary: string | null;
  providerMatchId: string | null;
  /** Marks matches whose result was manually verified by an official scorer. */
  dataSource: "manual" | "provider" | "demo";
  lastUpdated: string;
}

export interface Innings {
  id: ID;
  matchId: ID;
  inningsNumber: number;
  battingTeamId: ID;
  bowlingTeamId: ID;
  /** Derived cache from ball events, maintained transactionally. */
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  extras: number;
  declared: boolean;
  closed: boolean;
}

export interface BallEvent {
  id: ID;
  inningsId: ID;
  overNumber: number;
  ballNumber: number;
  legalBall: boolean;
  batterId: ID;
  bowlerId: ID;
  runsBatter: number;
  runsExtras: number;
  totalRuns: number;
  extraType: ExtraType | null;
  wicketType: WicketType | null;
  dismissedPlayerId: ID | null;
  fielderId: ID | null;
  commentary: string;
  providerEventId: string | null;
  createdAt: string;
}

export interface PlayingXIEntry {
  id: ID;
  matchId: ID;
  teamId: ID;
  playerId: ID;
  battingOrder: number;
  isCaptain: boolean;
  isWicketkeeper: boolean;
}

export interface SeasonBundle {
  season: Season;
  tournament: Tournament;
  teams: Team[];
  players: Player[];
  squads: SquadMember[];
  venues: Venue[];
  matches: Match[];
  innings: Innings[];
  ballEvents: BallEvent[];
  playingXI: PlayingXIEntry[];
}

/* ---------- Derived cricket view models ---------- */

export interface Dismissal {
  type: WicketType | "not_out";
  bowlerId: ID | null;
  fielderId: ID | null;
  dismissedPlayerId: ID | null;
}

export interface BattingEntry {
  playerId: ID;
  position: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  dismissal: Dismissal | null;
  strikeRate: number;
}

export interface BowlingEntry {
  playerId: ID;
  legalBalls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  economy: number;
  overs: string;
}

export interface FallOfWicket {
  wicketNumber: number;
  runs: number;
  legalBalls: number;
  over: string;
  batterId: ID;
  dismissalType: WicketType;
}

export interface Partnership {
  wicketNumber: number;
  batterAId: ID;
  batterBId: ID;
  runs: number;
  legalBalls: number;
  unbroken: boolean;
}

export interface ExtrasBreakdown {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
}

export interface InningsComputed {
  innings: Innings;
  runs: number;
  wickets: number;
  legalBalls: number;
  overs: string;
  runRate: number;
  batting: BattingEntry[];
  bowling: BowlingEntry[];
  fallOfWickets: FallOfWicket[];
  partnerships: Partnership[];
  extras: ExtrasBreakdown;
  lastFiveOversRuns: number;
  lastFiveOversWickets: number;
  isAllOut: boolean;
  isClosed: boolean;
}

export interface MatchComputed {
  match: Match;
  innings: InningsComputed[];
  currentInnings: InningsComputed | null;
  target: number | null;
  requiredRuns: number | null;
  requiredRunRate: number | null;
  currentRunRate: number | null;
  projectedScore: number | null;
  statusText: string;
  resultText: string | null;
  teamA: Team;
  teamB: Team;
  venue: Venue;
}

export interface StandingRow {
  position: number;
  teamId: ID;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  runsAgainst: number;
  ballsFaced: number;
  ballsBowled: number;
  nrr: number;
}

export interface BattingAggregate {
  playerId: ID;
  teamId: ID;
  innings: number;
  notOuts: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highScore: number;
  highScoreNotOut: boolean;
  fifties: number;
  hundreds: number;
  average: number;
  strikeRate: number;
}

export interface BowlingAggregate {
  playerId: ID;
  teamId: ID;
  innings: number;
  legalBalls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  average: number;
  economy: number;
  strikeRate: number;
  bestWickets: number;
  bestRuns: number;
  fourWicketHauls: number;
  fiveWicketHauls: number;
}

export interface TeamAggregate {
  teamId: ID;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  highestScore: number;
  lowestScore: number;
  highestScoreAgainst: number;
  highestSuccessfulChase: number | null;
  biggestWinByRuns: number | null;
  biggestWinByWickets: number | null;
}
