import type {
  BallEvent,
  Innings,
  Match,
  Player,
  PlayingXIEntry,
  Season,
  SeasonBundle,
  SeasonSettings,
  SeasonStatus,
  SquadMember,
  Team,
  Tournament,
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
  ArticleRevision,
  AuditLogEntry,
  CreateArticleInput,
  CreateMatchInput,
  CreatePlayerInput,
  CreateSeasonInput,
  CreateTeamInput,
  CreateTournamentInput,
  CreateVenueInput,
  CricketRepository,
  RecordBallInput,
  SearchResultGroup,
  SyncLogEntry,
  UpdateArticleInput,
  UpdateMatchInput,
} from "../repository";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatKathmanduDate, slugify } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

const DEFAULT_SETTINGS: SeasonSettings = {
  pointsWin: 2,
  pointsTie: 1,
  pointsNoResult: 1,
  ballsPerInnings: 120,
  allOutUsesFullQuota: true,
};

type Row = Record<string, any>;

function mapSeason(row: Row): Season {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    slug: row.slug,
    year: row.year,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    description: row.description ?? "",
    settings: { ...DEFAULT_SETTINGS, ...(row.settings ?? {}) },
    createdAt: row.created_at,
  };
}

function mapTournament(row: Row): Tournament {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    format: row.format,
    country: row.country,
    description: row.description ?? "",
  };
}

function mapTeam(row: Row): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortName: row.short_name,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color ?? "#166534",
    description: row.description ?? "",
    homeCity: row.home_city ?? "",
    active: row.active ?? true,
  };
}

function mapPlayer(row: Row): Player {
  return {
    id: row.id,
    fullName: row.full_name,
    slug: row.slug,
    profileImage: row.profile_image,
    dateOfBirth: row.date_of_birth,
    nationality: row.nationality ?? "Nepal",
    battingStyle: row.batting_style,
    bowlingStyle: row.bowling_style,
    playingRole: row.playing_role,
    biography: row.biography ?? "",
  };
}

function mapVenue(row: Row): Venue {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    country: row.country,
    capacity: row.capacity,
    description: row.description ?? "",
  };
}

function mapMatch(row: Row): Match {
  return {
    id: row.id,
    seasonId: row.season_id,
    tournamentId: row.tournament_id,
    matchNumber: row.match_number,
    slug: row.slug,
    teamAId: row.team_a_id,
    teamBId: row.team_b_id,
    venueId: row.venue_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    tossWinnerId: row.toss_winner_id,
    tossDecision: row.toss_decision,
    winnerId: row.winner_id,
    resultSummary: row.result_summary,
    providerMatchId: row.provider_match_id,
    dataSource: row.data_source ?? "manual",
    lastUpdated: row.last_updated,
  };
}

function mapInnings(row: Row): Innings {
  return {
    id: row.id,
    matchId: row.match_id,
    inningsNumber: row.innings_number,
    battingTeamId: row.batting_team_id,
    bowlingTeamId: row.bowling_team_id,
    totalRuns: row.total_runs,
    wickets: row.wickets,
    legalBalls: row.legal_balls,
    extras: row.extras,
    declared: row.declared ?? false,
    closed: row.closed ?? false,
  };
}

function mapBallEvent(row: Row): BallEvent {
  return {
    id: row.id,
    inningsId: row.innings_id,
    overNumber: row.over_number,
    ballNumber: row.ball_number,
    legalBall: row.legal_ball,
    batterId: row.batter_id,
    bowlerId: row.bowler_id,
    runsBatter: row.runs_batter,
    runsExtras: row.runs_extras,
    totalRuns: row.total_runs,
    extraType: row.extra_type,
    wicketType: row.wicket_type,
    dismissedPlayerId: row.dismissed_player_id,
    fielderId: row.fielder_id,
    commentary: row.commentary ?? "",
    providerEventId: row.provider_event_id,
    createdAt: row.created_at,
  };
}

function mapArticle(row: Row): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    featuredImage: row.featured_image,
    imageCaption: row.image_caption,
    categoryId: row.category_id,
    authorId: row.author_id,
    authorName: row.author_name ?? "NPL Cricket Hub Editorial",
    tags: row.tags ?? [],
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
    canonicalUrl: row.canonical_url,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readingMinutes: row.reading_minutes ?? 3,
    featured: row.featured ?? false,
  };
}

export class SupabaseRepository implements CricketRepository {
  readonly mode = "supabase" as const;
  readonly isDemo = false;

  private db() {
    return getSupabaseAdminClient();
  }

  private async one<T>(promise: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data as T;
  }

  private audit(actor: Actor | undefined, action: string, entityType: string, entityId: string, details: string) {
    if (!actor) return;
    void this.db()
      .from("admin_audit_logs")
      .insert({
        actor_id: actor.id,
        actor_email: actor.email,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      })
      .then(() => undefined);
  }

  async getSeasons(): Promise<Season[]> {
    const rows = await this.one<Row[]>(this.db().from("seasons").select("*").order("year", { ascending: false }));
    return rows.map(mapSeason);
  }

  async getTournaments(): Promise<Tournament[]> {
    const rows = await this.one<Row[]>(this.db().from("tournaments").select("*").order("name"));
    return rows.map(mapTournament);
  }

  async getActiveSeason(): Promise<Season | null> {
    const rows = await this.one<Row[]>(this.db().from("seasons").select("*").eq("status", "active").limit(1));
    return rows[0] ? mapSeason(rows[0]) : null;
  }

  async getSeasonBySlug(slug: string): Promise<Season | null> {
    const rows = await this.one<Row[]>(this.db().from("seasons").select("*").eq("slug", slug).limit(1));
    return rows[0] ? mapSeason(rows[0]) : null;
  }

  async getSeasonBundle(seasonId: string): Promise<SeasonBundle> {
    const seasonRows = await this.one<Row[]>(this.db().from("seasons").select("*").eq("id", seasonId).limit(1));
    const seasonRow = seasonRows[0];
    if (!seasonRow) throw new Error("Season not found");
    const season = mapSeason(seasonRow);

    const [tournamentRows, teams, players, squads, venues, matches, innings, xi] = await Promise.all([
      this.one<Row[]>(this.db().from("tournaments").select("*").eq("id", season.tournamentId).limit(1)),
      this.one<Row[]>(this.db().from("teams").select("*").eq("active", true)),
      this.one<Row[]>(this.db().from("players").select("*")),
      this.one<Row[]>(this.db().from("team_squads").select("*").eq("season_id", seasonId)),
      this.one<Row[]>(this.db().from("venues").select("*")),
      this.one<Row[]>(this.db().from("matches").select("*").eq("season_id", seasonId).order("scheduled_at")),
      this.one<Row[]>(this.db().from("innings").select("*")),
      this.one<Row[]>(this.db().from("playing_xi").select("*")),
    ]);

    const matchRows = matches;
    const matchIds = new Set(matchRows.map((row) => row.id as string));
    const inningsRows = innings.filter((row) => matchIds.has(row.match_id));
    const inningsIds = inningsRows.map((row) => row.id as string);

    let ballEvents: BallEvent[] = [];
    if (inningsIds.length > 0) {
      const rows = await this.one<Row[]>(
        this.db().from("ball_events").select("*").in("innings_id", inningsIds).order("created_at"),
      );
      ballEvents = rows.map(mapBallEvent);
    }

    return {
      season,
      tournament: tournamentRows[0] ? mapTournament(tournamentRows[0]) : { id: season.tournamentId, name: "Nepal Premier League", slug: "nepal-premier-league", format: "T20", country: "Nepal", description: "" },
      teams: teams.map(mapTeam),
      players: players.map(mapPlayer),
      squads: squads.map(
        (row): SquadMember => ({
          id: row.id,
          seasonId: row.season_id,
          teamId: row.team_id,
          playerId: row.player_id,
          jerseyNumber: row.jersey_number,
          captain: row.captain ?? false,
          viceCaptain: row.vice_captain ?? false,
        }),
      ),
      venues: venues.map(mapVenue),
      matches: matchRows.map(mapMatch),
      innings: inningsRows.map(mapInnings),
      ballEvents,
      playingXI: xi
        .filter((row) => matchIds.has(row.match_id))
        .map(
          (row): PlayingXIEntry => ({
            id: row.id,
            matchId: row.match_id,
            teamId: row.team_id,
            playerId: row.player_id,
            battingOrder: row.batting_order,
            isCaptain: row.is_captain ?? false,
            isWicketkeeper: row.is_wicketkeeper ?? false,
          }),
        ),
    };
  }

  async getAllBundles(): Promise<SeasonBundle[]> {
    const seasons = await this.getSeasons();
    return Promise.all(seasons.map((season) => this.getSeasonBundle(season.id)));
  }

  async getVenues(): Promise<Venue[]> {
    return (await this.one<Row[]>(this.db().from("venues").select("*"))).map(mapVenue);
  }

  async getNewsCategories(): Promise<NewsCategory[]> {
    const rows = await this.one<Row[]>(this.db().from("news_categories").select("*"));
    return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, description: row.description ?? "" }));
  }

  async getArticles(query: ArticleQuery = {}): Promise<NewsArticle[]> {
    let request = this.db().from("news_articles").select("*").order("published_at", { ascending: false });
    if (!query.includeDrafts) request = request.eq("status", "published");
    if (query.categorySlug) {
      const categories = await this.getNewsCategories();
      const category = categories.find((row) => row.slug === query.categorySlug);
      if (!category) return [];
      request = request.eq("category_id", category.id);
    }
    if (query.tag) request = request.contains("tags", [query.tag]);
    if (query.limit) request = request.limit(query.limit);
    const rows = await this.one<Row[]>(request);
    return rows.map(mapArticle);
  }

  async getArticleBySlug(slug: string, includeDrafts = false): Promise<NewsArticle | null> {
    let request = this.db().from("news_articles").select("*").eq("slug", slug);
    if (!includeDrafts) request = request.eq("status", "published");
    const rows = await this.one<Row[]>(request.limit(1));
    return rows[0] ? mapArticle(rows[0]) : null;
  }

  async getPolls(): Promise<Poll[]> {
    const [pollRows, optionRows] = await Promise.all([
      this.one<Row[]>(this.db().from("polls").select("*")),
      this.one<Row[]>(this.db().from("poll_options").select("*")),
    ]);
    return pollRows.map((poll) => {
      const options = optionRows
        .filter((option) => option.poll_id === poll.id)
        .map((option) => ({
          id: option.id,
          pollId: option.poll_id,
          label: option.label,
          teamId: option.team_id,
          playerId: option.player_id,
          voteCount: option.vote_count ?? 0,
        }));
      return {
        id: poll.id,
        question: poll.question,
        slug: poll.slug,
        description: poll.description ?? "",
        status: poll.status,
        closesAt: poll.closes_at,
        options,
        totalVotes: options.reduce((sum, option) => sum + option.voteCount, 0),
      };
    });
  }

  async getPredictions(seasonId: string): Promise<Prediction[]> {
    const matchRows = await this.one<Row[]>(this.db().from("matches").select("id").eq("season_id", seasonId));
    const matchIds = matchRows.map((row) => row.id as string);
    if (matchIds.length === 0) return [];
    const [predictionRows, optionRows] = await Promise.all([
      this.one<Row[]>(this.db().from("predictions").select("*").in("match_id", matchIds)),
      this.one<Row[]>(this.db().from("prediction_options").select("*")),
    ]);
    return predictionRows.map((prediction) => ({
      id: prediction.id,
      matchId: prediction.match_id,
      title: prediction.title,
      closesAt: prediction.closes_at,
      status: prediction.status,
      options: optionRows
        .filter((option) => option.prediction_id === prediction.id)
        .map((option) => ({
          id: option.id,
          predictionId: option.prediction_id,
          label: option.label,
          playerId: option.player_id,
          teamId: option.team_id,
          kind: option.kind,
        })),
    }));
  }

  async getUserPredictions(userId: string): Promise<UserPrediction[]> {
    const rows = await this.one<Row[]>(this.db().from("user_predictions").select("*").eq("user_id", userId));
    return rows.map((row) => ({
      id: row.id,
      predictionId: row.prediction_id,
      userId: row.user_id,
      optionId: row.option_id,
      pointsAwarded: row.points_awarded ?? 0,
      createdAt: row.created_at,
    }));
  }

  async getFanVotes(userId: string): Promise<FanVote[]> {
    const rows = await this.one<Row[]>(this.db().from("fan_votes").select("*").eq("user_id", userId));
    return rows.map((row) => ({
      id: row.id,
      pollId: row.poll_id,
      optionId: row.option_id,
      userId: row.user_id,
      createdAt: row.created_at,
    }));
  }

  async getComments(articleId: string, includePending = false): Promise<Comment[]> {
    let request = this.db().from("comments").select("*").eq("article_id", articleId).order("created_at");
    if (!includePending) request = request.eq("status", "approved");
    const rows = await this.one<Row[]>(request);
    return rows.map((row) => ({
      id: row.id,
      articleId: row.article_id,
      userId: row.user_id,
      username: row.author_name,
      body: row.body,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    const rows = await this.one<Row[]>(this.db().from("profiles").select("*").eq("id", id).limit(1));
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      avatarUrl: row.avatar_url,
      favouriteTeamId: row.favourite_team_id,
      role: row.role,
      points: row.points ?? 0,
      suspended: row.suspended ?? false,
      createdAt: row.created_at,
    };
  }

  async getUsers(): Promise<UserProfile[]> {
    const rows = await this.one<Row[]>(this.db().from("profiles").select("*").order("created_at", { ascending: false }));
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      avatarUrl: row.avatar_url,
      favouriteTeamId: row.favourite_team_id,
      role: row.role,
      points: row.points ?? 0,
      suspended: row.suspended ?? false,
      createdAt: row.created_at,
    }));
  }

  async search(query: string): Promise<SearchResultGroup[]> {
    const needle = query.trim();
    if (needle.length < 2) return [];
    const season = await this.getActiveSeason();
    if (!season) return [];
    const bundle = await this.getSeasonBundle(season.id);
    const teamName = new Map(bundle.teams.map((team) => [team.id, team.name]));
    const lower = needle.toLowerCase();

    const teams = bundle.teams
      .filter((team) => team.name.toLowerCase().includes(lower))
      .slice(0, 5)
      .map((team) => ({ title: team.name, subtitle: `Team · ${team.homeCity}`, href: `/teams/${team.slug}` }));
    const players = bundle.players
      .filter((player) => player.fullName.toLowerCase().includes(lower))
      .slice(0, 6)
      .map((player) => ({ title: player.fullName, subtitle: "Player", href: `/players/${player.slug}` }));
    const matches = bundle.matches
      .filter((match) => {
        const a = teamName.get(match.teamAId)?.toLowerCase() ?? "";
        const b = teamName.get(match.teamBId)?.toLowerCase() ?? "";
        return a.includes(lower) || b.includes(lower) || `match ${match.matchNumber}`.includes(lower);
      })
      .slice(0, 5)
      .map((match) => ({
        title: `${teamName.get(match.teamAId) ?? "TBC"} vs ${teamName.get(match.teamBId) ?? "TBC"}`,
        subtitle: `Match ${match.matchNumber} · ${formatKathmanduDate(match.scheduledAt)}`,
        href: match.status === "live" ? `/live/${match.slug}` : `/matches/${match.slug}`,
      }));
    const articles = (await this.getArticles({ limit: 40 }))
      .filter((article) => article.title.toLowerCase().includes(lower) || article.excerpt.toLowerCase().includes(lower))
      .slice(0, 5)
      .map((article) => ({ title: article.title, subtitle: "News", href: `/news/${article.slug}` }));
    const venues = bundle.venues
      .filter((venue) => venue.name.toLowerCase().includes(lower))
      .slice(0, 4)
      .map((venue) => ({ title: venue.name, subtitle: `Venue · ${venue.city}`, href: `/venues/${venue.slug}` }));
    const seasons = (await this.getSeasons())
      .filter((row) => row.name.toLowerCase().includes(lower))
      .slice(0, 3)
      .map((row) => ({ title: row.name, subtitle: "Season", href: `/seasons/${row.slug}` }));

    return [
      { type: "team", label: "Teams", items: teams },
      { type: "player", label: "Players", items: players },
      { type: "match", label: "Matches", items: matches },
      { type: "article", label: "News", items: articles },
      { type: "venue", label: "Venues", items: venues },
      { type: "season", label: "Seasons", items: seasons },
    ].filter((group) => group.items.length > 0) as SearchResultGroup[];
  }

  async getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    const rows = await this.one<Row[]>(
      this.db().from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(limit),
    );
    return rows.map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      actorEmail: row.actor_email,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details ?? "",
      createdAt: row.created_at,
    }));
  }

  async getSyncLogs(limit = 50): Promise<SyncLogEntry[]> {
    const rows = await this.one<Row[]>(
      this.db().from("data_sync_logs").select("*").order("started_at", { ascending: false }).limit(limit),
    );
    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      status: row.status,
      message: row.message ?? "",
      recordsProcessed: row.records_processed ?? 0,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
    }));
  }

  async recordSyncLog(entry: Omit<SyncLogEntry, "id">): Promise<SyncLogEntry> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("data_sync_logs")
        .insert({
          provider: entry.provider,
          status: entry.status,
          message: entry.message,
          records_processed: entry.recordsProcessed,
          started_at: entry.startedAt,
          finished_at: entry.finishedAt,
        })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not write sync log");
    return {
      id: row.id,
      provider: row.provider,
      status: row.status,
      message: row.message ?? "",
      recordsProcessed: row.records_processed ?? 0,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
    };
  }

  async recordBall(input: RecordBallInput): Promise<{ innings: Innings; event: BallEvent }> {
    const { data, error } = await this.db().rpc("record_ball_event", {
      p_match_id: input.matchId,
      p_batter_id: input.batterId,
      p_bowler_id: input.bowlerId,
      p_runs_batter: input.runsBatter,
      p_extra_type: input.extraType ?? null,
      p_runs_extras: input.runsExtras ?? 0,
      p_wicket_type: input.wicketType ?? null,
      p_dismissed_player_id: input.dismissedPlayerId ?? null,
      p_fielder_id: input.fielderId ?? null,
      p_commentary: input.commentary ?? null,
      p_actor_id: input.actor?.id ?? null,
    });
    if (error) throw new Error(error.message);
    const payload = data as { innings: Row; event: Row };
    this.audit(input.actor, "score.ball", "match", input.matchId, "Ball recorded");
    return { innings: mapInnings(payload.innings), event: mapBallEvent(payload.event) };
  }

  async undoLastBall(matchId: string, actor?: Actor): Promise<Innings | null> {
    const { data, error } = await this.db().rpc("undo_last_ball", { p_match_id: matchId, p_actor_id: actor?.id ?? null });
    if (error) throw new Error(error.message);
    return data ? mapInnings(data as Row) : null;
  }

  async startSecondInnings(matchId: string, actor?: Actor): Promise<Innings | null> {
    const matchRows = await this.one<Row[]>(this.db().from("matches").select("*").eq("id", matchId).limit(1));
    const match = matchRows[0];
    if (!match) throw new Error("Match not found");
    const inningsRows = await this.one<Row[]>(
      this.db().from("innings").select("*").eq("match_id", matchId).order("innings_number"),
    );
    if (inningsRows.length >= 2) {
      const second = inningsRows[1];
      return second ? mapInnings(second) : null;
    }
    const first = inningsRows[0];
    if (!first) throw new Error("First innings has not started");
    await this.db().from("innings").update({ closed: true }).eq("id", first.id);
    const inserted = await this.one<Row[]>(
      this.db()
        .from("innings")
        .insert({
          match_id: matchId,
          innings_number: 2,
          batting_team_id: first.bowling_team_id,
          bowling_team_id: first.batting_team_id,
        })
        .select("*"),
    );
    await this.db().from("matches").update({ status: "live" }).eq("id", matchId);
    this.audit(actor, "innings.start", "match", matchId, "Second innings started");
    return inserted[0] ? mapInnings(inserted[0]) : null;
  }

  async closeInnings(matchId: string, actor?: Actor): Promise<Innings | null> {
    const rows = await this.one<Row[]>(
      this.db().from("innings").select("*").eq("match_id", matchId).eq("closed", false).order("innings_number", { ascending: false }).limit(1),
    );
    const innings = rows[0];
    if (!innings) return null;
    await this.db().from("innings").update({ closed: true }).eq("id", innings.id);
    this.audit(actor, "innings.close", "match", matchId, "Innings closed");
    return mapInnings({ ...innings, closed: true });
  }

  async completeMatch(matchId: string, winnerId: string | null, summary: string, actor?: Actor): Promise<void> {
    const { error } = await this.db()
      .from("matches")
      .update({ status: "completed", winner_id: winnerId, result_summary: summary, last_updated: new Date().toISOString() })
      .eq("id", matchId);
    if (error) throw new Error(error.message);
    await this.db().from("innings").update({ closed: true }).eq("match_id", matchId);
    this.audit(actor, "match.complete", "match", matchId, summary);
  }

  async updateMatch(input: UpdateMatchInput): Promise<Match> {
    const patch: Row = {};
    const p = input.patch;
    if (p.status !== undefined) patch.status = p.status;
    if (p.scheduledAt !== undefined) patch.scheduled_at = p.scheduledAt;
    if (p.venueId !== undefined) patch.venue_id = p.venueId;
    if (p.tossWinnerId !== undefined) patch.toss_winner_id = p.tossWinnerId;
    if (p.tossDecision !== undefined) patch.toss_decision = p.tossDecision;
    if (p.winnerId !== undefined) patch.winner_id = p.winnerId;
    if (p.resultSummary !== undefined) patch.result_summary = p.resultSummary;
    patch.last_updated = new Date().toISOString();
    const rows = await this.one<Row[]>(this.db().from("matches").update(patch).eq("id", input.matchId).select("*"));
    const row = rows[0];
    if (!row) throw new Error("Match not found");
    this.audit(input.actor, "match.update", "match", input.matchId, JSON.stringify(patch));
    return mapMatch(row);
  }

  async createMatch(input: CreateMatchInput): Promise<Match> {
    const seasonRows = await this.one<Row[]>(this.db().from("seasons").select("*").eq("id", input.seasonId).limit(1));
    const season = seasonRows[0];
    if (!season) throw new Error("Season not found");
    const teams = await this.one<Row[]>(this.db().from("teams").select("*").in("id", [input.teamAId, input.teamBId]));
    const teamA = teams.find((row) => row.id === input.teamAId);
    const teamB = teams.find((row) => row.id === input.teamBId);
    if (!teamA || !teamB) throw new Error("Team not found");
    const existing = await this.one<Row[]>(this.db().from("matches").select("match_number").eq("season_id", input.seasonId));
    const matchNumber = input.matchNumber ?? Math.max(0, ...existing.map((row) => row.match_number as number)) + 1;
    const rows = await this.one<Row[]>(
      this.db()
        .from("matches")
        .insert({
          season_id: season.id,
          tournament_id: season.tournament_id,
          match_number: matchNumber,
          slug: `npl-${season.year}-match-${matchNumber}-${teamA.slug}-vs-${teamB.slug}`,
          team_a_id: teamA.id,
          team_b_id: teamB.id,
          venue_id: input.venueId,
          scheduled_at: input.scheduledAt,
          status: "scheduled",
          data_source: "manual",
        })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not create match");
    this.audit(input.actor, "match.create", "match", row.id, `${teamA.name} vs ${teamB.name}`);
    return mapMatch(row);
  }

  async createTournament(input: CreateTournamentInput): Promise<Tournament> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("tournaments")
        .insert({
          name: input.name,
          slug: slugify(input.name),
          format: input.format ?? "T20",
          country: input.country ?? "Nepal",
          description: input.description ?? "",
        })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not create tournament");
    this.audit(input.actor, "tournament.create", "tournament", row.id, input.name);
    return mapTournament(row);
  }

  async createSeason(input: CreateSeasonInput): Promise<Season> {
    const status = input.status ?? "upcoming";
    const rows = await this.one<Row[]>(
      this.db()
        .from("seasons")
        .insert({
          tournament_id: input.tournamentId,
          name: input.name,
          slug: slugify(input.name),
          year: input.year,
          start_date: input.startDate,
          end_date: input.endDate,
          status,
          description: input.description ?? "",
        })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not create season");
    if (status === "active") {
      const { error } = await this.db().from("seasons").update({ status: "completed" }).eq("status", "active").neq("id", row.id);
      if (error) throw new Error(`Season created, but previous active seasons could not be closed: ${error.message}`);
    }
    this.audit(input.actor, "season.create", "season", row.id, input.name);
    return mapSeason(row);
  }

  async updateSeasonStatus(seasonId: string, status: SeasonStatus, actor?: Actor): Promise<Season> {
    const rows = await this.one<Row[]>(this.db().from("seasons").update({ status }).eq("id", seasonId).select("*"));
    const row = rows[0];
    if (!row) throw new Error("Season not found");
    if (status === "active") {
      const { error } = await this.db().from("seasons").update({ status: "completed" }).eq("status", "active").neq("id", seasonId);
      if (error) throw new Error(`Season activated, but previous active seasons could not be closed: ${error.message}`);
    }
    this.audit(actor, "season.status", "season", seasonId, status);
    return mapSeason(row);
  }

  async createVenue(input: CreateVenueInput): Promise<Venue> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("venues")
        .insert({
          name: input.name,
          slug: slugify(input.name),
          city: input.city,
          country: input.country ?? "Nepal",
          capacity: input.capacity ?? null,
          description: input.description ?? "",
        })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not create venue");
    this.audit(input.actor, "venue.create", "venue", row.id, input.name);
    return mapVenue(row);
  }

  async updateVenue(venueId: string, patch: Partial<Venue>, actor?: Actor): Promise<Venue> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("venues")
        .update({
          name: patch.name,
          city: patch.city,
          country: patch.country,
          capacity: patch.capacity,
          description: patch.description,
        })
        .eq("id", venueId)
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Venue not found");
    this.audit(actor, "venue.update", "venue", venueId, JSON.stringify(patch));
    return mapVenue(row);
  }

  async createTeam(input: CreateTeamInput): Promise<Team> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("teams")
        .insert({
          name: input.name,
          slug: slugify(input.name),
          short_name: input.shortName.toUpperCase(),
          home_city: input.homeCity,
          description: input.description,
          primary_color: input.primaryColor ?? "#166534",
        })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not create team");
    this.audit(input.actor, "team.create", "team", row.id, input.name);
    return mapTeam(row);
  }

  async updateTeam(teamId: string, patch: Partial<Team>, actor?: Actor): Promise<Team> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("teams")
        .update({
          name: patch.name,
          short_name: patch.shortName,
          logo_url: patch.logoUrl,
          description: patch.description,
          home_city: patch.homeCity,
          active: patch.active,
          primary_color: patch.primaryColor,
        })
        .eq("id", teamId)
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Team not found");
    this.audit(actor, "team.update", "team", teamId, JSON.stringify(patch));
    return mapTeam(row);
  }

  async createPlayer(input: CreatePlayerInput): Promise<Player> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("players")
        .insert({
          full_name: input.fullName,
          slug: `${slugify(input.fullName)}-${Math.random().toString(36).slice(2, 6)}`,
          nationality: input.nationality ?? "Nepal",
          batting_style: input.battingStyle,
          bowling_style: input.bowlingStyle,
          playing_role: input.playingRole,
          biography: input.biography ?? "",
        })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not create player");
    this.audit(input.actor, "player.create", "player", row.id, input.fullName);
    return mapPlayer(row);
  }

  async updatePlayer(playerId: string, patch: Partial<Player>, actor?: Actor): Promise<Player> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("players")
        .update({
          full_name: patch.fullName,
          profile_image: patch.profileImage,
          nationality: patch.nationality,
          batting_style: patch.battingStyle,
          bowling_style: patch.bowlingStyle,
          playing_role: patch.playingRole,
          biography: patch.biography,
        })
        .eq("id", playerId)
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Player not found");
    this.audit(actor, "player.update", "player", playerId, JSON.stringify(patch));
    return mapPlayer(row);
  }

  async addSquadMember(seasonId: string, teamId: string, playerId: string, actor?: Actor): Promise<void> {
    const { error } = await this.db()
      .from("team_squads")
      .insert({ season_id: seasonId, team_id: teamId, player_id: playerId });
    if (error) throw new Error(error.message);
    this.audit(actor, "squad.add", "team", teamId, playerId);
  }

  async createArticle(input: CreateArticleInput): Promise<NewsArticle> {
    const status = input.status ?? "draft";
    const rows = await this.one<Row[]>(
      this.db()
        .from("news_articles")
        .insert({
          title: input.title,
          slug: slugify(input.slug || input.title),
          excerpt: input.excerpt,
          body: input.body,
          category_id: input.categoryId,
          author_id: input.actor?.id ?? null,
          author_name: input.actor?.email.split("@")[0] ?? "NPL Cricket Hub Editorial",
          tags: input.tags,
          seo_title: input.seoTitle ?? null,
          meta_description: input.metaDescription ?? input.excerpt,
          featured_image: input.featuredImage ?? null,
          image_caption: input.imageCaption ?? null,
          canonical_url: input.canonicalUrl ?? null,
          status,
          published_at: status === "published" ? new Date().toISOString() : null,
          featured: input.featured ?? false,
        })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not create article");
    await this.syncArticleTags(row.id, input.tags);
    await this.writeArticleRevision(row, input.actor);
    this.audit(input.actor, "article.create", "article", row.id, input.title);
    return mapArticle(row);
  }

  private async syncArticleTags(articleId: string, tags: string[]): Promise<void> {
    try {
      await this.db().from("article_tags").delete().eq("article_id", articleId);
      if (tags.length > 0) {
        await this.db()
          .from("article_tags")
          .insert(tags.map((tag) => ({ article_id: articleId, tag })));
      }
    } catch {
      // The normalised tag table is an index, not the source of truth.
    }
  }

  private async writeArticleRevision(row: Row, actor?: Actor): Promise<void> {
    try {
      await this.db().from("news_article_revisions").insert({
        article_id: row.id,
        editor_id: actor?.id ?? null,
        title: row.title,
        excerpt: row.excerpt,
        body: row.body,
        status: row.status,
      });
    } catch {
      // Revision history must never block publishing.
    }
  }

  async updateArticle(input: UpdateArticleInput): Promise<NewsArticle> {
    const existing = await this.one<Row[]>(
      this.db().from("news_articles").select("*").eq("id", input.articleId).limit(1),
    );
    const previous = existing[0];
    if (!previous) throw new Error("Article not found");

    const patch: Row = {};
    const p = input.patch;
    if (p.title !== undefined) patch.title = p.title;
    if (p.slug !== undefined) patch.slug = p.slug;
    if (p.excerpt !== undefined) patch.excerpt = p.excerpt;
    if (p.body !== undefined) patch.body = p.body;
    if (p.categoryId !== undefined) patch.category_id = p.categoryId;
    if (p.tags !== undefined) patch.tags = p.tags;
    if (p.status !== undefined) {
      patch.status = p.status;
      if (p.status === "published") patch.published_at = new Date().toISOString();
    }
    if (p.seoTitle !== undefined) patch.seo_title = p.seoTitle;
    if (p.metaDescription !== undefined) patch.meta_description = p.metaDescription;
    if (p.featuredImage !== undefined) patch.featured_image = p.featuredImage;
    if (p.imageCaption !== undefined) patch.image_caption = p.imageCaption;
    if (p.canonicalUrl !== undefined) patch.canonical_url = p.canonicalUrl;
    if (p.featured !== undefined) patch.featured = p.featured;
    patch.updated_at = new Date().toISOString();
    const rows = await this.one<Row[]>(
      this.db().from("news_articles").update(patch).eq("id", input.articleId).select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Article not found");
    await this.writeArticleRevision(previous, input.actor);
    if (p.tags !== undefined) await this.syncArticleTags(row.id, p.tags);
    this.audit(input.actor, "article.update", "article", input.articleId, JSON.stringify(Object.keys(patch)));
    return mapArticle(row);
  }

  async getArticleRevisions(articleId: string): Promise<ArticleRevision[]> {
    try {
      const rows = await this.one<Row[]>(
        this.db()
          .from("news_article_revisions")
          .select("*")
          .eq("article_id", articleId)
          .order("created_at", { ascending: false }),
      );
      return rows.map((row) => ({
        id: row.id,
        articleId: row.article_id,
        editorId: row.editor_id,
        title: row.title,
        excerpt: row.excerpt,
        body: row.body,
        status: row.status,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  }

  async archiveArticle(articleId: string, actor?: Actor): Promise<void> {
    const { error } = await this.db()
      .from("news_articles")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", articleId);
    if (error) throw new Error(error.message);
    this.audit(actor, "article.archive", "article", articleId, "Archived");
  }

  async addComment(articleId: string, userId: string, username: string, body: string): Promise<Comment> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("comments")
        .insert({ article_id: articleId, user_id: userId, author_name: username, body: body.trim(), status: "pending" })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not add comment");
    return {
      id: row.id,
      articleId: row.article_id,
      userId: row.user_id,
      username: row.author_name,
      body: row.body,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async moderateComment(commentId: string, status: Comment["status"], actor: Actor): Promise<void> {
    const { error } = await this.db().from("comments").update({ status }).eq("id", commentId);
    if (error) throw new Error(error.message);
    this.audit(actor, `comment.${status}`, "comment", commentId, status);
  }

  async reportComment(commentId: string, reporterId: string, reason: string): Promise<void> {
    const { error } = await this.db()
      .from("comment_reports")
      .insert({ comment_id: commentId, reporter_id: reporterId, reason });
    if (error) throw new Error(error.message);
  }

  async castVote(pollId: string, optionId: string, userId: string): Promise<Poll> {
    const { error } = await this.db().rpc("cast_poll_vote", {
      p_poll_id: pollId,
      p_option_id: optionId,
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
    const polls = await this.getPolls();
    const poll = polls.find((row) => row.id === pollId);
    if (!poll) throw new Error("Poll not found");
    return poll;
  }

  async submitPrediction(predictionId: string, optionId: string, userId: string): Promise<UserPrediction> {
    const rows = await this.one<Row[]>(
      this.db()
        .from("user_predictions")
        .insert({ prediction_id: predictionId, option_id: optionId, user_id: userId })
        .select("*"),
    );
    const row = rows[0];
    if (!row) throw new Error("Could not submit prediction");
    return {
      id: row.id,
      predictionId: row.prediction_id,
      userId: row.user_id,
      optionId: row.option_id,
      pointsAwarded: row.points_awarded ?? 0,
      createdAt: row.created_at,
    };
  }

  async toggleBookmark(userId: string, entityType: "team" | "player" | "article", entityId: string): Promise<boolean> {
    const existing = await this.one<Row[]>(
      this.db()
        .from("bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .limit(1),
    );
    if (existing[0]) {
      await this.db().from("bookmarks").delete().eq("id", existing[0].id);
      return false;
    }
    await this.db().from("bookmarks").insert({ user_id: userId, entity_type: entityType, entity_id: entityId });
    return true;
  }

  async setUserRole(userId: string, role: UserProfile["role"], actor: Actor): Promise<void> {
    const { error } = await this.db().from("profiles").update({ role }).eq("id", userId);
    if (error) throw new Error(error.message);
    this.audit(actor, "user.role", "user", userId, role);
  }

  async setUserSuspended(userId: string, suspended: boolean, actor: Actor): Promise<void> {
    const { error } = await this.db().from("profiles").update({ suspended }).eq("id", userId);
    if (error) throw new Error(error.message);
    this.audit(actor, suspended ? "user.suspend" : "user.restore", "user", userId, String(suspended));
  }
}

let cached: SupabaseRepository | null = null;

export function getSupabaseRepository(): SupabaseRepository {
  if (!cached) cached = new SupabaseRepository();
  return cached;
}
