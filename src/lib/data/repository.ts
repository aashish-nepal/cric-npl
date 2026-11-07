import type {
  BallEvent,
  BattingStyle,
  BowlingStyle,
  ExtraType,
  Innings,
  Match,
  MatchStatus,
  Player,
  PlayerRole,
  Season,
  SeasonBundle,
  Team,
  TossDecision,
  UserRole,
  Venue,
  WicketType,
} from "@/types/cricket";
import type {
  Comment,
  FanVote,
  NewsArticle,
  NewsCategory,
  Poll,
  Prediction,
  UserPrediction,
  UserProfile,
} from "@/types/content";

export type DataMode = "demo" | "supabase";

export interface Actor {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface SyncLogEntry {
  id: string;
  provider: string;
  status: "success" | "partial" | "failed" | "skipped";
  message: string;
  recordsProcessed: number;
  startedAt: string;
  finishedAt: string;
}

export interface SearchResultItem {
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchResultGroup {
  type: "team" | "player" | "match" | "article" | "venue" | "season";
  label: string;
  items: SearchResultItem[];
}

export interface ArticleQuery {
  categorySlug?: string;
  tag?: string;
  limit?: number;
  includeDrafts?: boolean;
}

export interface RecordBallInput {
  matchId: string;
  batterId: string;
  bowlerId: string;
  runsBatter: number;
  extraType?: ExtraType | null;
  runsExtras?: number;
  wicketType?: WicketType | null;
  dismissedPlayerId?: string | null;
  fielderId?: string | null;
  commentary?: string;
  actor?: Actor;
}

export interface CreateTeamInput {
  name: string;
  shortName: string;
  homeCity: string;
  description: string;
  primaryColor?: string;
  actor?: Actor;
}

export interface CreatePlayerInput {
  fullName: string;
  playingRole: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  nationality?: string;
  biography?: string;
  actor?: Actor;
}

export interface CreateMatchInput {
  seasonId: string;
  teamAId: string;
  teamBId: string;
  venueId: string;
  scheduledAt: string;
  matchNumber?: number;
  actor?: Actor;
}

export interface UpdateMatchInput {
  matchId: string;
  patch: Partial<
    Pick<Match, "status" | "scheduledAt" | "venueId" | "tossWinnerId" | "tossDecision" | "winnerId" | "resultSummary">
  >;
  actor?: Actor;
}

export interface CreateArticleInput {
  title: string;
  slug?: string;
  excerpt: string;
  body: string;
  categoryId: string;
  tags: string[];
  status?: NewsArticle["status"];
  seoTitle?: string | null;
  metaDescription?: string | null;
  featured?: boolean;
  actor?: Actor;
}

export interface UpdateArticleInput {
  articleId: string;
  patch: Partial<
    Pick<
      NewsArticle,
      | "title"
      | "slug"
      | "excerpt"
      | "body"
      | "categoryId"
      | "tags"
      | "status"
      | "seoTitle"
      | "metaDescription"
      | "featured"
    >
  >;
  actor?: Actor;
}

export interface CricketRepository {
  readonly mode: DataMode;
  readonly isDemo: boolean;

  /* Reads */
  getSeasons(): Promise<Season[]>;
  getActiveSeason(): Promise<Season | null>;
  getSeasonBySlug(slug: string): Promise<Season | null>;
  getSeasonBundle(seasonId: string): Promise<SeasonBundle>;
  getAllBundles(): Promise<SeasonBundle[]>;
  getVenues(): Promise<Venue[]>;
  getNewsCategories(): Promise<NewsCategory[]>;
  getArticles(query?: ArticleQuery): Promise<NewsArticle[]>;
  getArticleBySlug(slug: string, includeDrafts?: boolean): Promise<NewsArticle | null>;
  getPolls(): Promise<Poll[]>;
  getPredictions(seasonId: string): Promise<Prediction[]>;
  getUserPredictions(userId: string): Promise<UserPrediction[]>;
  getFanVotes(userId: string): Promise<FanVote[]>;
  getComments(articleId: string, includePending?: boolean): Promise<Comment[]>;
  getUserById(id: string): Promise<UserProfile | null>;
  getUsers(): Promise<UserProfile[]>;
  search(query: string): Promise<SearchResultGroup[]>;
  getAuditLogs(limit?: number): Promise<AuditLogEntry[]>;
  getSyncLogs(limit?: number): Promise<SyncLogEntry[]>;

  /* Scoring + administration */
  recordBall(input: RecordBallInput): Promise<{ innings: Innings; event: BallEvent }>;
  undoLastBall(matchId: string, actor?: Actor): Promise<Innings | null>;
  startSecondInnings(matchId: string, actor?: Actor): Promise<Innings | null>;
  closeInnings(matchId: string, actor?: Actor): Promise<Innings | null>;
  completeMatch(matchId: string, winnerId: string | null, summary: string, actor?: Actor): Promise<void>;
  updateMatch(input: UpdateMatchInput): Promise<Match>;
  createMatch(input: CreateMatchInput): Promise<Match>;
  createTeam(input: CreateTeamInput): Promise<Team>;
  updateTeam(teamId: string, patch: Partial<Team>, actor?: Actor): Promise<Team>;
  createPlayer(input: CreatePlayerInput): Promise<Player>;
  updatePlayer(playerId: string, patch: Partial<Player>, actor?: Actor): Promise<Player>;
  addSquadMember(seasonId: string, teamId: string, playerId: string, actor?: Actor): Promise<void>;
  createArticle(input: CreateArticleInput): Promise<NewsArticle>;
  updateArticle(input: UpdateArticleInput): Promise<NewsArticle>;
  archiveArticle(articleId: string, actor?: Actor): Promise<void>;
  addComment(articleId: string, userId: string, username: string, body: string): Promise<Comment>;
  moderateComment(commentId: string, status: Comment["status"], actor: Actor): Promise<void>;
  reportComment(commentId: string, reporterId: string, reason: string): Promise<void>;
  castVote(pollId: string, optionId: string, userId: string): Promise<Poll>;
  submitPrediction(predictionId: string, optionId: string, userId: string): Promise<UserPrediction>;
  toggleBookmark(userId: string, entityType: "team" | "player" | "article", entityId: string): Promise<boolean>;
  setUserRole(userId: string, role: UserRole, actor: Actor): Promise<void>;
  setUserSuspended(userId: string, suspended: boolean, actor: Actor): Promise<void>;
}

export type {
  BallEvent,
  Comment,
  FanVote,
  Innings,
  Match,
  MatchStatus,
  NewsArticle,
  NewsCategory,
  Player,
  Poll,
  Prediction,
  Season,
  SeasonBundle,
  Team,
  TossDecision,
  UserPrediction,
  UserProfile,
  UserRole,
  Venue,
};
