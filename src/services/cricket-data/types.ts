import { z } from "zod";

/**
 * Provider-independent cricket data contract.
 *
 * Adapters map a licensed feed into these shapes. The application never renders
 * provider payloads directly: every event is validated, normalised and written
 * through the scoring repository so scorecards/statistics stay consistent.
 *
 * No endpoint, field name or credential is assumed here. A real adapter must be
 * written against the provider's published documentation and recorded in
 * docs/DATA_PROVIDER.md.
 */

export const providerTournamentSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(2),
  format: z.string().min(1).default("T20"),
  country: z.string().min(2).default("Nepal"),
});

export const providerSeasonSchema = z.object({
  providerId: z.string().min(1),
  tournamentProviderId: z.string().min(1),
  name: z.string().min(2),
  year: z.number().int().min(1900).max(2200),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
});

export const providerTeamSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(2),
  shortName: z.string().min(2).max(6),
  homeCity: z.string().default(""),
});

export const providerPlayerSchema = z.object({
  providerId: z.string().min(1),
  fullName: z.string().min(2),
  teamProviderId: z.string().min(1).nullable().default(null),
  role: z.enum(["batter", "bowler", "all_rounder", "wicketkeeper"]).default("batter"),
});

export const providerFixtureSchema = z.object({
  providerId: z.string().min(1),
  seasonProviderId: z.string().min(1),
  matchNumber: z.number().int().min(1),
  homeTeamProviderId: z.string().min(1),
  awayTeamProviderId: z.string().min(1),
  venueName: z.string().min(2),
  scheduledAt: z.string().datetime(),
  status: z.enum(["scheduled", "live", "completed", "abandoned", "cancelled"]),
});

export const providerBallEventSchema = z.object({
  providerEventId: z.string().min(1),
  providerMatchId: z.string().min(1),
  inningsNumber: z.number().int().min(1).max(2),
  overNumber: z.number().int().min(1),
  ballNumber: z.number().int().min(1).max(12),
  batterProviderId: z.string().min(1),
  bowlerProviderId: z.string().min(1),
  runsBatter: z.number().int().min(0).max(6),
  runsExtras: z.number().int().min(0).max(7).default(0),
  extraType: z.enum(["wide", "no_ball", "bye", "leg_bye", "penalty"]).nullable().default(null),
  wicketType: z
    .enum([
      "bowled",
      "caught",
      "caught_and_bowled",
      "lbw",
      "run_out",
      "stumped",
      "hit_wicket",
      "retired_hurt",
      "obstructing_field",
      "timed_out",
    ])
    .nullable()
    .default(null),
  dismissedPlayerProviderId: z.string().nullable().default(null),
  commentary: z.string().max(1000).default(""),
});

export type ProviderTournament = z.infer<typeof providerTournamentSchema>;
export type ProviderSeason = z.infer<typeof providerSeasonSchema>;
export type ProviderTeam = z.infer<typeof providerTeamSchema>;
export type ProviderPlayer = z.infer<typeof providerPlayerSchema>;
export type ProviderFixture = z.infer<typeof providerFixtureSchema>;
export type ProviderBallEvent = z.infer<typeof providerBallEventSchema>;

export interface ProviderLiveScore {
  providerMatchId: string;
  status: "live" | "completed" | "abandoned" | "cancelled";
  battingTeamProviderId: string | null;
  runs: number;
  wickets: number;
  overs: string;
  updatedAt: string;
}

export interface ProviderScorecard {
  providerMatchId: string;
  innings: Array<{
    inningsNumber: number;
    battingTeamProviderId: string;
    runs: number;
    wickets: number;
    overs: string;
  }>;
}

export interface ProviderTournamentStatistics {
  providerSeasonId: string;
  leadingRunScorerProviderId: string | null;
  leadingWicketTakerProviderId: string | null;
}

export interface CricketDataProvider {
  readonly id: string;
  /** True only after the feed has been verified against the provider's docs and rights. */
  readonly verified: boolean;
  fetchTournaments(): Promise<ProviderTournament[]>;
  fetchSeasons(tournamentProviderId: string): Promise<ProviderSeason[]>;
  fetchTeams(seasonProviderId: string): Promise<ProviderTeam[]>;
  fetchPlayers(teamProviderId: string): Promise<ProviderPlayer[]>;
  fetchFixtures(seasonProviderId: string): Promise<ProviderFixture[]>;
  fetchResults(seasonProviderId: string): Promise<ProviderFixture[]>;
  fetchLiveScores(): Promise<ProviderLiveScore[]>;
  fetchScorecard(providerMatchId: string): Promise<ProviderScorecard | null>;
  fetchBallByBall(providerMatchId: string): Promise<ProviderBallEvent[]>;
  fetchTournamentStatistics(seasonProviderId: string): Promise<ProviderTournamentStatistics | null>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(message = "No verified cricket data provider is configured. Manual scoring remains the source of truth.") {
    super(message);
    this.name = "ProviderNotConfiguredError";
  }
}
