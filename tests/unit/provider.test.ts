import { describe, expect, it } from "vitest";
import { createCricketDataProvider, providerIsConfigured } from "@/services/cricket-data";
import { ProviderNotConfiguredError } from "@/services/cricket-data/types";

describe("cricket data provider registry", () => {
  it("defaults to the manual provider", () => {
    const provider = createCricketDataProvider("none");
    expect(provider.id).toBe("manual");
    expect(provider.verified).toBe(false);
    expect(providerIsConfigured()).toBe(false);
  });

  it("fails loudly for an unknown provider", () => {
    expect(() => createCricketDataProvider("made-up-feed")).toThrow(ProviderNotConfiguredError);
  });

  it("manual provider returns no fabricated data", async () => {
    const provider = createCricketDataProvider("manual");
    await expect(provider.fetchFixtures("season")).resolves.toEqual([]);
    await expect(provider.fetchLiveScores()).resolves.toEqual([]);
    await expect(provider.fetchScorecard("match")).resolves.toBeNull();
    await expect(provider.fetchBallByBall("match")).resolves.toEqual([]);
  });
});
