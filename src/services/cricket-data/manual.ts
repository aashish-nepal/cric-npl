import type {
  CricketDataProvider,
  ProviderBallEvent,
  ProviderFixture,
  ProviderLiveScore,
  ProviderPlayer,
  ProviderScorecard,
  ProviderSeason,
  ProviderTeam,
  ProviderTournament,
  ProviderTournamentStatistics,
} from "./types";

/**
 * Manual fallback provider.
 *
 * The product deliberately ships without a fabricated feed. When no licensed
 * provider is configured, this adapter returns empty collections so callers can
 * log a "skipped" sync instead of pretending data exists.
 */
export class ManualProvider implements CricketDataProvider {
  readonly id = "manual";
  readonly verified = false;

  async fetchTournaments(): Promise<ProviderTournament[]> {
    return [];
  }
  async fetchSeasons(): Promise<ProviderSeason[]> {
    return [];
  }
  async fetchTeams(): Promise<ProviderTeam[]> {
    return [];
  }
  async fetchPlayers(): Promise<ProviderPlayer[]> {
    return [];
  }
  async fetchFixtures(): Promise<ProviderFixture[]> {
    return [];
  }
  async fetchResults(): Promise<ProviderFixture[]> {
    return [];
  }
  async fetchLiveScores(): Promise<ProviderLiveScore[]> {
    return [];
  }
  async fetchScorecard(): Promise<ProviderScorecard | null> {
    return null;
  }
  async fetchBallByBall(): Promise<ProviderBallEvent[]> {
    return [];
  }
  async fetchTournamentStatistics(): Promise<ProviderTournamentStatistics | null> {
    return null;
  }
}
