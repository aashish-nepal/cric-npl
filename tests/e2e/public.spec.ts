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

  test("Nepali landing page is available", async ({ page }) => {
    await page.goto("/ne");
    await expect(page.locator('div[lang="ne"]').first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("unknown routes show the not-found page", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
