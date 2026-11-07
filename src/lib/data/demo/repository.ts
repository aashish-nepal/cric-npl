import type {
  BallEvent,
  Innings,
  Match,
  Player,
  Season,
  SeasonBundle,
  Team,
  UserRole,
  Venue,
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
import type {
  Actor,
  ArticleQuery,
  AuditLogEntry,
  CreateArticleInput,
  CreateMatchInput,
  CreatePlayerInput,
  CreateTeamInput,
  CricketRepository,
  RecordBallInput,
  SearchResultGroup,
  SyncLogEntry,
  UpdateArticleInput,
  UpdateMatchInput,
} from "../repository";
import { buildDemoDatabase, buildSeasonBundle, DEMO_TEAM_NAMES, type DemoDatabase } from "./seed";
import { computeInnings, isInningsComplete, nextDeliveryPosition } from "@/lib/engine/innings";
import { formatKathmanduDate, slugify } from "@/lib/utils";

const SYSTEM_ACTOR: Actor = { id: "system", email: "system@nplcrickethub.local", role: "super_admin" };

function newId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function sortArticles(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
}

export class DemoRepository implements CricketRepository {
  readonly mode = "demo" as const;
  readonly isDemo = true;

  private db: DemoDatabase;
  private auditLogs: AuditLogEntry[] = [];
  private syncLogs: SyncLogEntry[] = [
    {
      id: "sync-demo-1",
      provider: "manual",
      status: "skipped",
      message: "No external cricket provider configured. Matches are managed through the admin scoring console.",
      recordsProcessed: 0,
      startedAt: "2026-11-07T06:00:00.000Z",
      finishedAt: "2026-11-07T06:00:01.000Z",
    },
  ];
  private bookmarks: Array<{ userId: string; entityType: string; entityId: string }> = [];
  private userPredictions: UserPrediction[] = [];
  private commentReports: Array<{ commentId: string; reporterId: string; reason: string }> = [];

  constructor() {
    this.db = buildDemoDatabase();
  }

  private audit(actor: Actor | undefined, action: string, entityType: string, entityId: string, details: string) {
    const who = actor ?? SYSTEM_ACTOR;
    this.auditLogs.unshift({
      id: newId("audit"),
      actorId: who.id,
      actorEmail: who.email,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    });
  }

  /* ------------------------------ Reads ------------------------------ */

  async getSeasons(): Promise<Season[]> {
    return [...this.db.seasons].sort((a, b) => b.year - a.year);
  }

  async getActiveSeason(): Promise<Season | null> {
    return this.db.seasons.find((season) => season.status === "active") ?? this.db.seasons[0] ?? null;
  }

  async getSeasonBySlug(slug: string): Promise<Season | null> {
    return this.db.seasons.find((season) => season.slug === slug) ?? null;
  }

  async getSeasonBundle(seasonId: string): Promise<SeasonBundle> {
    const season = this.db.seasons.find((row) => row.id === seasonId);
    if (!season) throw new Error("Season not found");
    return buildSeasonBundle(this.db, season);
  }

  async getAllBundles(): Promise<SeasonBundle[]> {
    const seasons = [...this.db.seasons].sort((a, b) => b.year - a.year);
    return seasons.map((season) => buildSeasonBundle(this.db, season));
  }

  async getVenues(): Promise<Venue[]> {
    return [...this.db.venues];
  }

  async getNewsCategories(): Promise<NewsCategory[]> {
    return [...this.db.newsCategories];
  }

  async getArticles(query: ArticleQuery = {}): Promise<NewsArticle[]> {
    let articles = [...this.db.articles];
    if (!query.includeDrafts) articles = articles.filter((article) => article.status === "published");
    if (query.categorySlug) {
      const category = this.db.newsCategories.find((row) => row.slug === query.categorySlug);
      if (!category) return [];
      articles = articles.filter((article) => article.categoryId === category.id);
    }
    if (query.tag) articles = articles.filter((article) => article.tags.includes(query.tag as string));
    const sorted = sortArticles(articles);
    return query.limit ? sorted.slice(0, query.limit) : sorted;
  }

  async getArticleBySlug(slug: string, includeDrafts = false): Promise<NewsArticle | null> {
    const article = this.db.articles.find((row) => row.slug === slug);
    if (!article) return null;
    if (!includeDrafts && article.status !== "published") return null;
    return article;
  }

  async getPolls(): Promise<Poll[]> {
    return this.db.polls.map((poll) => ({ ...poll, options: poll.options.map((option) => ({ ...option })) }));
  }

  async getPredictions(seasonId: string): Promise<Prediction[]> {
    const matchIds = new Set(this.db.matches.filter((match) => match.seasonId === seasonId).map((match) => match.id));
    return this.db.predictions.filter((prediction) => matchIds.has(prediction.matchId));
  }

  async getUserPredictions(userId: string): Promise<UserPrediction[]> {
    return this.userPredictions.filter((row) => row.userId === userId);
  }

  async getFanVotes(userId: string): Promise<FanVote[]> {
    return this.db.fanVotes.filter((row) => row.userId === userId);
  }

  async getComments(articleId: string, includePending = false): Promise<Comment[]> {
    return this.db.comments
      .filter((comment) => comment.articleId === articleId)
      .filter((comment) => includePending || comment.status === "approved")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    return this.db.users.find((user) => user.id === id) ?? null;
  }

  async getUsers(): Promise<UserProfile[]> {
    return [...this.db.users];
  }

  async search(query: string): Promise<SearchResultGroup[]> {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    const active = await this.getActiveSeason();
    if (!active) return [];
    const bundle = await this.getSeasonBundle(active.id);
    const teamName = new Map(bundle.teams.map((team) => [team.id, team.name]));

    const teams = bundle.teams
      .filter((team) => team.name.toLowerCase().includes(needle) || team.shortName.toLowerCase().includes(needle))
      .slice(0, 5)
      .map((team) => ({ title: team.name, subtitle: `Team · ${team.homeCity}`, href: `/teams/${team.slug}` }));

    const players = bundle.players
      .filter((player) => player.fullName.toLowerCase().includes(needle))
      .slice(0, 6)
      .map((player) => {
        const squad = bundle.squads.find((row) => row.playerId === player.id);
        return {
          title: player.fullName,
          subtitle: `Player · ${squad ? (teamName.get(squad.teamId) ?? "NPL") : "NPL"}`,
          href: `/players/${player.slug}`,
        };
      });

    const matches = bundle.matches
      .filter((match) => {
        const a = teamName.get(match.teamAId)?.toLowerCase() ?? "";
        const b = teamName.get(match.teamBId)?.toLowerCase() ?? "";
        return a.includes(needle) || b.includes(needle) || `match ${match.matchNumber}`.includes(needle);
      })
      .slice(0, 5)
      .map((match) => ({
        title: `${teamName.get(match.teamAId) ?? "TBC"} vs ${teamName.get(match.teamBId) ?? "TBC"}`,
        subtitle: `Match ${match.matchNumber} · ${formatKathmanduDate(match.scheduledAt)}`,
        href: match.status === "live" ? `/live/${match.slug}` : `/matches/${match.slug}`,
      }));

    const articles = sortArticles(this.db.articles.filter((article) => article.status === "published"))
      .filter(
        (article) =>
          article.title.toLowerCase().includes(needle) ||
          article.excerpt.toLowerCase().includes(needle) ||
          article.tags.some((tag) => tag.toLowerCase().includes(needle)),
      )
      .slice(0, 5)
      .map((article) => ({ title: article.title, subtitle: "News", href: `/news/${article.slug}` }));

    const venues = this.db.venues
      .filter((venue) => venue.name.toLowerCase().includes(needle) || venue.city.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((venue) => ({ title: venue.name, subtitle: `Venue · ${venue.city}`, href: `/venues/${venue.slug}` }));

    const seasons = this.db.seasons
      .filter((season) => season.name.toLowerCase().includes(needle) || String(season.year).includes(needle))
      .slice(0, 3)
      .map((season) => ({ title: season.name, subtitle: "Season", href: `/seasons/${season.slug}` }));

    const groups: SearchResultGroup[] = [
      { type: "team", label: "Teams", items: teams },
      { type: "player", label: "Players", items: players },
      { type: "match", label: "Matches", items: matches },
      { type: "article", label: "News", items: articles },
      { type: "venue", label: "Venues", items: venues },
      { type: "season", label: "Seasons", items: seasons },
    ];
    return groups.filter((group) => group.items.length > 0);
  }

  async getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    return this.auditLogs.slice(0, limit);
  }

  async getSyncLogs(limit = 50): Promise<SyncLogEntry[]> {
    return this.syncLogs.slice(0, limit);
  }

  /* --------------------------- Scoring --------------------------- */

  private findMatch(matchId: string): Match {
    const match = this.db.matches.find((row) => row.id === matchId);
    if (!match) throw new Error("Match not found");
    return match;
  }

  private matchInnings(matchId: string): Innings[] {
    return this.db.innings
      .filter((innings) => innings.matchId === matchId)
      .sort((a, b) => a.inningsNumber - b.inningsNumber);
  }

  private currentInnings(matchId: string): Innings | null {
    const innings = this.matchInnings(matchId);
    return innings.find((row) => !row.closed) ?? innings[innings.length - 1] ?? null;
  }

  private validateSquad(playerId: string, teamId: string, seasonId: string, label: string) {
    const inSquad = this.db.squads.some(
      (row) => row.playerId === playerId && row.teamId === teamId && row.seasonId === seasonId,
    );
    if (!inSquad) throw new Error(`${label} is not in the selected team's squad`);
  }

  async recordBall(input: RecordBallInput): Promise<{ innings: Innings; event: BallEvent }> {
    const match = this.findMatch(input.matchId);
    if (match.status !== "live") throw new Error("Scoring is only available for live matches");
    const season = this.db.seasons.find((row) => row.id === match.seasonId);
    const ballsPerInnings = season?.settings.ballsPerInnings ?? 120;

    let innings = this.currentInnings(match.id);
    if (!innings) {
      const tossWinner = match.tossWinnerId ?? match.teamAId;
      const battingTeamId =
        match.tossDecision === "bowl"
          ? tossWinner === match.teamAId
            ? match.teamBId
            : match.teamAId
          : tossWinner;
      const bowlingTeamId = battingTeamId === match.teamAId ? match.teamBId : match.teamAId;
      innings = {
        id: newId("innings"),
        matchId: match.id,
        inningsNumber: 1,
        battingTeamId,
        bowlingTeamId,
        totalRuns: 0,
        wickets: 0,
        legalBalls: 0,
        extras: 0,
        declared: false,
        closed: false,
      };
      this.db.innings.push(innings);
    }
    if (innings.closed) throw new Error("No open innings. Start an innings before scoring.");

    this.validateSquad(input.batterId, innings.battingTeamId, match.seasonId, "Batter");
    this.validateSquad(input.bowlerId, innings.bowlingTeamId, match.seasonId, "Bowler");

    const extraType = input.extraType ?? null;
    const legalBall = extraType !== "wide" && extraType !== "no_ball";
    const runsBatter = Math.max(0, Math.min(6, Math.trunc(input.runsBatter)));
    const runsExtras = Math.max(0, Math.min(7, Math.trunc(input.runsExtras ?? (extraType ? 1 : 0))));
    const wicketType = input.wicketType ?? null;
    if (wicketType && runsBatter > 0) throw new Error("A wicket delivery cannot also score runs off the bat");

    const position = nextDeliveryPosition(innings.legalBalls);
    const totalRuns = runsBatter + runsExtras;
    const event: BallEvent = {
      id: newId("ball"),
      inningsId: innings.id,
      overNumber: position.overNumber,
      ballNumber: position.ballNumber,
      legalBall,
      batterId: input.batterId,
      bowlerId: input.bowlerId,
      runsBatter,
      runsExtras,
      totalRuns,
      extraType,
      wicketType,
      dismissedPlayerId: wicketType ? (input.dismissedPlayerId ?? input.batterId) : null,
      fielderId: input.fielderId ?? null,
      commentary:
        input.commentary?.trim() ||
        `${position.overNumber}.${position.ballNumber} — ${totalRuns} run${totalRuns === 1 ? "" : "s"}${wicketType ? `, ${wicketType.replaceAll("_", " ")}` : ""}`,
      providerEventId: null,
      createdAt: new Date().toISOString(),
    };

    this.db.ballEvents.push(event);
    innings.totalRuns += totalRuns;
    if (wicketType && wicketType !== "retired_hurt") innings.wickets += 1;
    if (legalBall) innings.legalBalls += 1;
    innings.extras += runsExtras;
    match.lastUpdated = event.createdAt;

    const complete = isInningsComplete(innings.legalBalls, innings.wickets, ballsPerInnings);
    if (complete) innings.closed = true;

    this.audit(input.actor, "score.ball", "match", match.id, `Ball ${position.overNumber}.${position.ballNumber}: ${totalRuns} run(s)`);

    if (innings.inningsNumber === 2) {
      const [first] = this.matchInnings(match.id);
      if (first) {
        const target = first.totalRuns + 1;
        if (innings.totalRuns >= target) {
          innings.closed = true;
          const winnerId = innings.battingTeamId;
          const wicketsInHand = 10 - innings.wickets;
          match.status = "completed";
          match.winnerId = winnerId;
          match.resultSummary = `${DEMO_TEAM_NAMES[winnerId] ?? winnerId} won by ${wicketsInHand} wicket${wicketsInHand === 1 ? "" : "s"}`;
        } else if (innings.closed) {
          if (innings.totalRuns === first.totalRuns) {
            match.status = "completed";
            match.resultSummary = "Match tied";
          } else {
            match.status = "completed";
            match.winnerId = first.battingTeamId;
            const margin = first.totalRuns - innings.totalRuns;
            match.resultSummary = `${DEMO_TEAM_NAMES[first.battingTeamId] ?? first.battingTeamId} won by ${margin} run${margin === 1 ? "" : "s"}`;
          }
        }
      }
    }

    return { innings, event };
  }

  async undoLastBall(matchId: string, actor?: Actor): Promise<Innings | null> {
    const match = this.findMatch(matchId);
    const innings = this.currentInnings(matchId) ?? this.matchInnings(matchId).at(-1) ?? null;
    if (!innings) throw new Error("No innings to correct");

    const events = this.db.ballEvents
      .filter((event) => event.inningsId === innings.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = events.at(-1);
    if (!last) throw new Error("No ball events to undo");

    this.db.ballEvents = this.db.ballEvents.filter((event) => event.id !== last.id);
    const remaining = this.db.ballEvents.filter((event) => event.inningsId === innings.id);
    const recomputed = computeInnings(innings, remaining);
    innings.totalRuns = recomputed.runs;
    innings.wickets = recomputed.wickets;
    innings.legalBalls = recomputed.legalBalls;
    innings.extras = recomputed.extras.total;
    innings.closed = false;
    match.lastUpdated = new Date().toISOString();
    if (match.status === "completed") {
      match.status = "live";
      match.winnerId = null;
      match.resultSummary = null;
    }
    this.audit(actor, "score.undo", "match", match.id, `Removed ball ${last.overNumber}.${last.ballNumber}`);
    return innings;
  }

  async startSecondInnings(matchId: string, actor?: Actor): Promise<Innings | null> {
    const match = this.findMatch(matchId);
    const existing = this.matchInnings(matchId);
    if (existing.length >= 2) return existing[1] ?? null;
    const first = existing[0];
    if (!first) throw new Error("First innings has not started");
    first.closed = true;
    const innings: Innings = {
      id: newId("innings"),
      matchId,
      inningsNumber: 2,
      battingTeamId: first.bowlingTeamId,
      bowlingTeamId: first.battingTeamId,
      totalRuns: 0,
      wickets: 0,
      legalBalls: 0,
      extras: 0,
      declared: false,
      closed: false,
    };
    this.db.innings.push(innings);
    match.status = "live";
    match.lastUpdated = new Date().toISOString();
    this.audit(actor, "innings.start", "match", matchId, "Second innings started");
    return innings;
  }

  async closeInnings(matchId: string, actor?: Actor): Promise<Innings | null> {
    const innings = this.currentInnings(matchId);
    if (!innings) return null;
    innings.closed = true;
    this.audit(actor, "innings.close", "match", matchId, `Innings ${innings.inningsNumber} closed`);
    return innings;
  }

  async completeMatch(matchId: string, winnerId: string | null, summary: string, actor?: Actor): Promise<void> {
    const match = this.findMatch(matchId);
    match.status = "completed";
    match.winnerId = winnerId;
    match.resultSummary = summary;
    match.lastUpdated = new Date().toISOString();
    this.matchInnings(matchId).forEach((innings) => {
      innings.closed = true;
    });
    this.audit(actor, "match.complete", "match", matchId, summary);
  }

  async updateMatch(input: UpdateMatchInput): Promise<Match> {
    const match = this.findMatch(input.matchId);
    Object.assign(match, input.patch);
    match.lastUpdated = new Date().toISOString();
    this.audit(input.actor, "match.update", "match", match.id, JSON.stringify(input.patch));
    return match;
  }

  async createMatch(input: CreateMatchInput): Promise<Match> {
    const season = this.db.seasons.find((row) => row.id === input.seasonId);
    if (!season) throw new Error("Season not found");
    if (input.teamAId === input.teamBId) throw new Error("A team cannot play itself");
    const teamA = this.db.teams.find((team) => team.id === input.teamAId);
    const teamB = this.db.teams.find((team) => team.id === input.teamBId);
    if (!teamA || !teamB) throw new Error("Team not found");
    const venue = this.db.venues.find((row) => row.id === input.venueId);
    if (!venue) throw new Error("Venue not found");

    const matchNumber =
      input.matchNumber ?? Math.max(0, ...this.db.matches.filter((row) => row.seasonId === season.id).map((row) => row.matchNumber)) + 1;
    const match: Match = {
      id: newId("match"),
      seasonId: season.id,
      tournamentId: season.tournamentId,
      matchNumber,
      slug: `npl-${season.year}-match-${matchNumber}-${teamA.slug}-vs-${teamB.slug}`,
      teamAId: teamA.id,
      teamBId: teamB.id,
      venueId: venue.id,
      scheduledAt: input.scheduledAt,
      status: "scheduled",
      tossWinnerId: null,
      tossDecision: null,
      winnerId: null,
      resultSummary: null,
      providerMatchId: null,
      dataSource: "manual",
      lastUpdated: new Date().toISOString(),
    };
    this.db.matches.push(match);
    this.audit(input.actor, "match.create", "match", match.id, `${teamA.name} vs ${teamB.name}`);
    return match;
  }

  /* --------------------------- Admin CRUD --------------------------- */

  async createTeam(input: CreateTeamInput): Promise<Team> {
    const slug = slugify(input.name);
    if (this.db.teams.some((team) => team.slug === slug)) throw new Error("A team with that name already exists");
    const team: Team = {
      id: newId("team"),
      name: input.name,
      slug,
      shortName: input.shortName.toUpperCase(),
      logoUrl: null,
      primaryColor: input.primaryColor ?? "#166534",
      description: input.description,
      homeCity: input.homeCity,
      active: true,
    };
    this.db.teams.push(team);
    this.audit(input.actor, "team.create", "team", team.id, team.name);
    return team;
  }

  async updateTeam(teamId: string, patch: Partial<Team>, actor?: Actor): Promise<Team> {
    const team = this.db.teams.find((row) => row.id === teamId);
    if (!team) throw new Error("Team not found");
    Object.assign(team, patch);
    this.audit(actor, "team.update", "team", team.id, JSON.stringify(patch));
    return team;
  }

  async createPlayer(input: CreatePlayerInput): Promise<Player> {
    const slug = `${slugify(input.fullName)}-${Math.random().toString(36).slice(2, 6)}`;
    const player: Player = {
      id: newId("player"),
      fullName: input.fullName,
      slug,
      profileImage: null,
      dateOfBirth: null,
      nationality: input.nationality ?? "Nepal",
      battingStyle: input.battingStyle,
      bowlingStyle: input.bowlingStyle,
      playingRole: input.playingRole,
      biography: input.biography ?? "",
      isDemo: true,
    };
    this.db.players.push(player);
    this.audit(input.actor, "player.create", "player", player.id, player.fullName);
    return player;
  }

  async updatePlayer(playerId: string, patch: Partial<Player>, actor?: Actor): Promise<Player> {
    const player = this.db.players.find((row) => row.id === playerId);
    if (!player) throw new Error("Player not found");
    Object.assign(player, patch);
    this.audit(actor, "player.update", "player", player.id, JSON.stringify(patch));
    return player;
  }

  async addSquadMember(seasonId: string, teamId: string, playerId: string, actor?: Actor): Promise<void> {
    if (this.db.squads.some((row) => row.seasonId === seasonId && row.playerId === playerId)) {
      throw new Error("Player is already in a squad for this season");
    }
    this.db.squads.push({
      id: newId("squad"),
      seasonId,
      teamId,
      playerId,
      jerseyNumber: null,
      captain: false,
      viceCaptain: false,
    });
    this.audit(actor, "squad.add", "team", teamId, `Added ${playerId}`);
  }

  /* --------------------------- Editorial --------------------------- */

  async createArticle(input: CreateArticleInput): Promise<NewsArticle> {
    const category = this.db.newsCategories.find((row) => row.id === input.categoryId);
    if (!category) throw new Error("Category not found");
    const slug = slugify(input.slug || input.title);
    if (this.db.articles.some((article) => article.slug === slug)) throw new Error("An article with that slug already exists");
    const now = new Date().toISOString();
    const status = input.status ?? "draft";
    const article: NewsArticle = {
      id: newId("article"),
      title: input.title,
      slug,
      excerpt: input.excerpt,
      body: input.body,
      featuredImage: null,
      imageCaption: null,
      categoryId: category.id,
      authorId: input.actor?.id ?? "user-editor",
      authorName: input.actor?.email.split("@")[0] ?? "NPL Cricket Hub Editorial",
      tags: input.tags,
      seoTitle: input.seoTitle ?? null,
      metaDescription: input.metaDescription ?? input.excerpt,
      canonicalUrl: null,
      status,
      publishedAt: status === "published" ? now : null,
      updatedAt: now,
      readingMinutes: Math.max(2, Math.round(input.body.split(/\s+/).length / 200)),
      featured: input.featured ?? false,
    };
    this.db.articles.push(article);
    this.audit(input.actor, "article.create", "article", article.id, article.title);
    return article;
  }

  async updateArticle(input: UpdateArticleInput): Promise<NewsArticle> {
    const article = this.db.articles.find((row) => row.id === input.articleId);
    if (!article) throw new Error("Article not found");
    const wasPublished = article.status === "published";
    Object.assign(article, input.patch);
    article.updatedAt = new Date().toISOString();
    if (!wasPublished && article.status === "published") article.publishedAt = article.updatedAt;
    this.audit(input.actor, "article.update", "article", article.id, JSON.stringify(Object.keys(input.patch)));
    return article;
  }

  async archiveArticle(articleId: string, actor?: Actor): Promise<void> {
    const article = this.db.articles.find((row) => row.id === articleId);
    if (!article) throw new Error("Article not found");
    article.status = "archived";
    article.updatedAt = new Date().toISOString();
    this.audit(actor, "article.archive", "article", article.id, article.title);
  }

  /* --------------------------- Fan zone --------------------------- */

  async addComment(articleId: string, userId: string, username: string, body: string): Promise<Comment> {
    if (body.trim().length < 2) throw new Error("Comment is too short");
    if (body.length > 2000) throw new Error("Comment is too long");
    const user = await this.getUserById(userId);
    if (user?.suspended) throw new Error("This account is suspended");
    const comment: Comment = {
      id: newId("comment"),
      articleId,
      userId,
      username,
      body: body.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.db.comments.push(comment);
    return comment;
  }

  async moderateComment(commentId: string, status: Comment["status"], actor: Actor): Promise<void> {
    const comment = this.db.comments.find((row) => row.id === commentId);
    if (!comment) throw new Error("Comment not found");
    comment.status = status;
    this.audit(actor, `comment.${status}`, "comment", comment.id, comment.body.slice(0, 80));
  }

  async reportComment(commentId: string, reporterId: string, reason: string): Promise<void> {
    this.commentReports.push({ commentId, reporterId, reason });
  }

  async castVote(pollId: string, optionId: string, userId: string): Promise<Poll> {
    const poll = this.db.polls.find((row) => row.id === pollId);
    if (!poll) throw new Error("Poll not found");
    if (poll.status !== "open" || new Date(poll.closesAt) < new Date()) throw new Error("This poll is closed");
    if (this.db.fanVotes.some((vote) => vote.pollId === pollId && vote.userId === userId)) {
      throw new Error("You have already voted in this poll");
    }
    const option = poll.options.find((row) => row.id === optionId);
    if (!option) throw new Error("Option not found");
    option.voteCount += 1;
    poll.totalVotes += 1;
    this.db.fanVotes.push({
      id: newId("vote"),
      pollId,
      optionId,
      userId,
      createdAt: new Date().toISOString(),
    });
    return { ...poll, options: poll.options.map((row) => ({ ...row })) };
  }

  async submitPrediction(predictionId: string, optionId: string, userId: string): Promise<UserPrediction> {
    const prediction = this.db.predictions.find((row) => row.id === predictionId);
    if (!prediction) throw new Error("Prediction not found");
    if (prediction.status !== "open" || new Date(prediction.closesAt) < new Date()) {
      throw new Error("Predictions are closed for this match");
    }
    if (this.userPredictions.some((row) => row.predictionId === predictionId && row.userId === userId)) {
      throw new Error("You have already predicted this market");
    }
    if (!prediction.options.some((row) => row.id === optionId)) throw new Error("Option not found");
    const row: UserPrediction = {
      id: newId("user-prediction"),
      predictionId,
      userId,
      optionId,
      pointsAwarded: 0,
      createdAt: new Date().toISOString(),
    };
    this.userPredictions.push(row);
    return row;
  }

  async toggleBookmark(userId: string, entityType: "team" | "player" | "article", entityId: string): Promise<boolean> {
    const index = this.bookmarks.findIndex(
      (row) => row.userId === userId && row.entityType === entityType && row.entityId === entityId,
    );
    if (index >= 0) {
      this.bookmarks.splice(index, 1);
      return false;
    }
    this.bookmarks.push({ userId, entityType, entityId });
    return true;
  }

  /* --------------------------- Users --------------------------- */

  async setUserRole(userId: string, role: UserRole, actor: Actor): Promise<void> {
    const user = this.db.users.find((row) => row.id === userId);
    if (!user) throw new Error("User not found");
    if (user.role === "super_admin" && role !== "super_admin") {
      const superAdmins = this.db.users.filter((row) => row.role === "super_admin");
      if (superAdmins.length <= 1) throw new Error("Cannot remove the last super admin");
    }
    user.role = role;
    this.audit(actor, "user.role", "user", userId, role);
  }

  async setUserSuspended(userId: string, suspended: boolean, actor: Actor): Promise<void> {
    const user = this.db.users.find((row) => row.id === userId);
    if (!user) throw new Error("User not found");
    user.suspended = suspended;
    this.audit(actor, suspended ? "user.suspend" : "user.restore", "user", userId, String(suspended));
  }
}

declare global {
  var __nplDemoRepository: DemoRepository | undefined;
}

export function getDemoRepository(): DemoRepository {
  if (!globalThis.__nplDemoRepository) {
    globalThis.__nplDemoRepository = new DemoRepository();
  }
  return globalThis.__nplDemoRepository;
}
