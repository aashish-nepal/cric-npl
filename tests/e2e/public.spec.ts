import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("homepage renders the live product surfaces", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/NPL Cricket Hub/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("header").first()).toBeVisible();
    await expect(page.getByText(/Independent Nepali cricket coverage/i).first()).toBeVisible();
    await expect(page.getByText(/Demo dataset/i).first()).toBeVisible();
  });

  test("live scores page and match centre are reachable", async ({ page }) => {
    await page.goto("/live");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/live/i);
    const matchLink = page.locator('a[href^="/live/"]').first();
    await expect(matchLink).toBeVisible();
    await matchLink.click();
    await expect(page).toHaveURL(/\/live\//);
    await expect(page.getByText(/Ball-by-ball commentary/i).first()).toBeVisible();
  });

  test("points table and statistics render derived data", async ({ page }) => {
    await page.goto("/points-table");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("table").first()).toBeVisible();

    await page.goto("/statistics");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("table").first()).toBeVisible();
  });

  test("news index opens an article", async ({ page }) => {
    await page.goto("/news");
    const article = page.locator('a[href^="/news/"]:not([href*="/category/"]):not([href$=".xml"])').first();
    await expect(article).toBeVisible();
    await article.click();
    await expect(page).toHaveURL(/\/news\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("SEO endpoints are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("<urlset");

    const rss = await request.get("/news/rss.xml");
    expect(rss.ok()).toBeTruthy();
    expect(await rss.text()).toContain("<rss");
  });

  test("editorial and corrections policies are public and discoverable", async ({ page, request }) => {
    const policyRoutes = [
      ["/editorial-policy", "Editorial policy"],
      ["/corrections-policy", "Corrections policy"],
    ] as const;
    for (const [route, heading] of policyRoutes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole("link", { name: /contact page/i })).toBeVisible();
    }

    const sitemap = await request.get("/sitemap.xml");
    const body = await sitemap.text();
    expect(body).toContain("/editorial-policy");
    expect(body).toContain("/corrections-policy");
  });

  test("Nepali landing page is available", async ({ page }) => {
    await page.goto("/ne");
    await expect(page.locator('div[lang="ne"]').first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("statistics leaderboard sub-routes render derived tables", async ({ page }) => {
    const routes = [
      "/statistics/batting",
      "/statistics/bowling",
      "/statistics/most-runs",
      "/statistics/most-wickets",
      "/statistics/most-sixes",
      "/statistics/best-average",
      "/statistics/records",
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("table").first()).toBeVisible();
    }
  });

  test("statistics team filter narrows the leaderboard", async ({ page }) => {
    await page.goto("/statistics/batting");
    const teamFilter = page.getByRole("navigation", { name: "Team filter" }).getByRole("link").nth(1);
    await expect(teamFilter).toBeVisible();
    await teamFilter.click();
    await expect(page).toHaveURL(/team=/);
    await expect(page.getByRole("table").first()).toBeVisible();
  });

  test("Nepali section routes render localized navigation", async ({ page }) => {
    const routes = [
      "/ne/live",
      "/ne/fixtures",
      "/ne/results",
      "/ne/points-table",
      "/ne/teams",
      "/ne/players",
      "/ne/statistics",
      "/ne/news",
      "/ne/seasons",
      "/ne/venues",
      "/ne/fan-zone",
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('div[lang="ne"]').first()).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("sitemap advertises statistics and Nepali routes", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    const body = await sitemap.text();
    expect(body).toContain("/statistics/batting");
    expect(body).toContain("/statistics/records");
    expect(body).toContain("/ne/live");
    expect(body).toContain("/ne/statistics");
  });

  test("unknown routes show the not-found page", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
