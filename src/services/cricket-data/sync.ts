import { getRepository } from "@/lib/data";
import type { SyncLogEntry } from "@/lib/data/repository";
import { createCricketDataProvider } from "./index";
import { providerFixtureSchema } from "./types";

export interface ProviderSyncResult {
  provider: string;
  verified: boolean;
  fixturesSeen: number;
  fixturesValid: number;
  fixturesRejected: number;
  log: SyncLogEntry;
}

/**
 * Fetch and validate fixtures for a season.
 *
 * Validation happens before anything touches the database. Invalid rows are
 * rejected individually and reported in the sync log rather than aborting the
 * whole run. With no provider configured the run is logged as `skipped`, which
 * is what the admin system page surfaces to operators.
 */
export async function syncProviderSeason(seasonProviderId: string): Promise<ProviderSyncResult> {
  const repository = getRepository();
  const startedAt = new Date().toISOString();
  let providerName = "manual";

  try {
    const provider = createCricketDataProvider();
    providerName = provider.id;
    if (!provider.verified) {
      const finishedAt = new Date().toISOString();
      const log = await repository.recordSyncLog({
        provider: provider.id,
        status: "skipped",
        message: "No verified provider configured. Manual scoring is the source of truth.",
        recordsProcessed: 0,
        startedAt,
        finishedAt,
      });
      return { provider: provider.id, verified: false, fixturesSeen: 0, fixturesValid: 0, fixturesRejected: 0, log };
    }

    const raw = await provider.fetchFixtures(seasonProviderId);
    let valid = 0;
    let rejected = 0;
    for (const fixture of raw) {
      const parsed = providerFixtureSchema.safeParse(fixture);
      if (parsed.success) valid += 1;
      else rejected += 1;
    }

    const finishedAt = new Date().toISOString();
    const log = await repository.recordSyncLog({
      provider: provider.id,
      status: rejected === 0 ? "success" : valid === 0 ? "failed" : "partial",
      message: `Validated ${valid} fixture(s); rejected ${rejected}. Ingestion is adapter-specific and must be enabled explicitly.`,
      recordsProcessed: valid,
      startedAt,
      finishedAt,
    });
    return { provider: provider.id, verified: true, fixturesSeen: raw.length, fixturesValid: valid, fixturesRejected: rejected, log };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : "Unknown provider sync failure";
    const log = await repository.recordSyncLog({
      provider: providerName,
      status: "failed",
      message,
      recordsProcessed: 0,
      startedAt,
      finishedAt,
    });
    return { provider: providerName, verified: false, fixturesSeen: 0, fixturesValid: 0, fixturesRejected: 0, log };
  }
}
