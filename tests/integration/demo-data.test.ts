import { beforeAll, describe, expect, it } from "vitest";
import { buildDemoDatabase, buildSeasonBundle } from "@/lib/data/demo/seed";
import { computeSeasonAnalytics } from "@/lib/engine/analytics";
import { DemoRepository } from "@/lib/data/demo/repository";
import type { SeasonBundle } from "@/types/cricket";

let database: ReturnType<typeof buildDemoDatabase>;
let bundle2026: SeasonBundle;

beforeAll(() => {
  database = buildDemoDatabase();
  const season = database.seasons.find((row) => row.year === 2026);
  if (!season) throw new Error("Missing demo season");
  bundle2026 = buildSeasonBundle(database, season);
});

describe("demo dataset integrity", () => {
  it("contains both seasons, eight teams and a full squad pool", () => {
    expect(database.seasons).toHaveLength(2);
    expect(database.teams).toHaveLength(8);
    expect(database.players).toHaveLength(96);
    expect(bundle2026.matches).toHaveLength(28);
    expect(bundle2026.squads).toHaveLength(96);
  });

  it("derives scorecards that reconcile with innings totals", () => {
    const analytics = computeSeasonAnalytics(bundle2026);
    expect(analytics.inningsById.size).toBeGreaterThan(40);
    for (const computed of analytics.inningsById.values()) {
      expect(computed.runs).toBe(computed.innings.totalRuns);
      expect(computed.wickets).toBe(computed.innings.wickets);
      expect(computed.legalBalls).toBe(computed.innings.legalBalls);
      expect(Number.isFinite(computed.runRate)).toBe(true);
      expect(computed.runs).toBeGreaterThanOrEqual(0);
      expect(computed.wickets).toBeLessThanOrEqual(10);
      expect(computed.legalBalls).toBeLessThanOrEqual(120);
    }
  });

  it("has a live match with an open second innings and a target", () => {
    const analytics = computeSeasonAnalytics(bundle2026);
    const live = analytics.matches.find((row) => row.match.status === "live");
    expect(live).toBeDefined();
    expect(live?.innings).toHaveLength(2);
    expect(live?.currentInnings?.innings.inningsNumber).toBe(2);
    expect(live?.target).toBeGreaterThan(0);
    expect(live?.requiredRuns).not.toBeNull();
  });

  it("produces a complete, ordered standings table", () => {
    const analytics = computeSeasonAnalytics(bundle2026);
    expect(analytics.standings).toHaveLength(8);
    const played = analytics.standings.reduce((sum, row) => sum + row.played, 0);
    // 23 completed + 1 abandoned = 24 fixtures, two team appearances each.
    expect(played).toBe(48);
    for (const row of analytics.standings) {
      expect(row.position).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(row.nrr)).toBe(true);
      expect(row.points).toBe(row.won * 2 + row.tied + row.noResult);
    }
  });

  it("computes leaderboards and records from events", () => {
    const analytics = computeSeasonAnalytics(bundle2026);
    expect(analytics.batting.length).toBeGreaterThan(20);
    expect(analytics.bowling.length).toBeGreaterThan(10);
    expect(analytics.records.leadingRunScorer?.runs).toBeGreaterThan(0);
    expect(analytics.records.leadingWicketTaker?.wickets).toBeGreaterThan(0);
    expect(analytics.records.highestTeamTotal?.runs).toBeGreaterThan(100);
    expect(analytics.records.highestIndividualScore?.highScore).toBeGreaterThan(0);
  });

  it("marks every completed match with a result summary", () => {
    const analytics = computeSeasonAnalytics(bundle2026);
    for (const row of analytics.matches) {
      if (row.match.status === "completed") {
        expect(row.match.resultSummary).toBeTruthy();
      }
    }
  });
});

describe("demo repository operations", () => {
  it("supports search across teams, venues and matches", async () => {
    const repository = new DemoRepository();
    const results = await repository.search("Kathmandu");
    expect(results.length).toBeGreaterThan(0);
    const types = results.map((group) => group.type);
    expect(types).toContain("team");
  });

  it("records and undoes a ball through the scoring path", async () => {
    const repository = new DemoRepository();
    const season = await repository.getActiveSeason();
    expect(season).not.toBeNull();
    const bundle = await repository.getSeasonBundle(season!.id);
    const live = bundle.matches.find((match) => match.status === "live");
    expect(live).toBeDefined();
    const current = bundle.innings
      .filter((innings) => innings.matchId === live!.id && !innings.closed)
      .sort((a, b) => b.inningsNumber - a.inningsNumber)[0];
    expect(current).toBeDefined();
    const batter = bundle.squads.find((row) => row.teamId === current!.battingTeamId);
    const bowler = bundle.squads.find((row) => row.teamId === current!.bowlingTeamId);
    expect(batter).toBeDefined();
    expect(bowler).toBeDefined();

    const beforeRuns = current!.totalRuns;
    const beforeBalls = current!.legalBalls;
    await repository.recordBall({
      matchId: live!.id,
      batterId: batter!.playerId,
      bowlerId: bowler!.playerId,
      runsBatter: 1,
      actor: { id: "user-admin", email: "admin@nplcrickethub.local", role: "super_admin" },
    });
    const afterBundle = await repository.getSeasonBundle(season!.id);
    const after = afterBundle.innings.find((row) => row.id === current!.id);
    expect(after?.totalRuns).toBe(beforeRuns + 1);
    expect(after?.legalBalls).toBe(beforeBalls + 1);

    await repository.undoLastBall(live!.id);
    const undone = (await repository.getSeasonBundle(season!.id)).innings.find((row) => row.id === current!.id);
    expect(undone?.totalRuns).toBe(beforeRuns);
    expect(undone?.legalBalls).toBe(beforeBalls);
  });

  it("accepts one vote per user per poll", async () => {
    const repository = new DemoRepository();
    const polls = await repository.getPolls();
    const poll = polls[0];
    expect(poll).toBeDefined();
    const option = poll!.options[0];
    await repository.castVote(poll!.id, option!.id, "user-fan");
    await expect(repository.castVote(poll!.id, option!.id, "user-fan")).rejects.toThrow(/already voted/i);
  });

  it("creates, publishes and archives an article", async () => {
    const repository = new DemoRepository();
    const categories = await repository.getNewsCategories();
    const category = categories[0];
    const article = await repository.createArticle({
      title: "Test article for the newsroom",
      excerpt: "A short test excerpt.",
      body: "## Test\n\nBody copy for the editorial test.",
      categoryId: category!.id,
      tags: ["test"],
      actor: { id: "user-editor", email: "editor@nplcrickethub.local", role: "editor" },
    });
    expect(article.status).toBe("draft");
    const published = await repository.updateArticle({
      articleId: article.id,
      patch: { status: "published" },
      actor: { id: "user-editor", email: "editor@nplcrickethub.local", role: "editor" },
    });
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();
    await repository.archiveArticle(article.id);
    const archived = await repository.getArticleBySlug(article.slug, true);
    expect(archived?.status).toBe("archived");
  });
});
