import { ManualProvider } from "./manual";
import { ProviderNotConfiguredError, type CricketDataProvider } from "./types";

export * from "./types";
export { ManualProvider } from "./manual";

/**
 * Provider registry. Add a new adapter here only after its documentation,
 * licensing and Nepal Premier League coverage have been verified.
 *
 * Unknown provider names fail loudly rather than silently falling back, so a
 * typo in production cannot be mistaken for "no provider configured".
 */
const REGISTRY: Record<string, () => CricketDataProvider> = {
  none: () => new ManualProvider(),
  manual: () => new ManualProvider(),
};

export function createCricketDataProvider(name = process.env.CRICKET_PROVIDER): CricketDataProvider {
  const key = (name ?? "none").trim().toLowerCase();
  const factory = REGISTRY[key];
  if (!factory) {
    throw new ProviderNotConfiguredError(
      `Unknown CRICKET_PROVIDER "${name}". No adapter is registered. Add a verified adapter in src/services/cricket-data before enabling it.`,
    );
  }
  return factory();
}

export function providerIsConfigured(): boolean {
  try {
    return createCricketDataProvider().verified;
  } catch {
    return false;
  }
}
