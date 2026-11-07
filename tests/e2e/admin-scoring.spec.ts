import { expect, test } from "@playwright/test";

const ADMIN = { email: "admin@nplcrickethub.local", password: "demo-admin-password" };

test.describe("manual scoring console", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test("records a delivery and then undo it on a live match", async ({ page }) => {
    await page.goto("/auth/login?next=%2Fadmin%2Fmatches");
    await page.getByLabel("Email address").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/matches$/);

    const scoreLink = page.getByRole("link", { name: /Score/i }).first();
    await expect(scoreLink).toBeVisible();
    await scoreLink.click();
    await expect(page).toHaveURL(/\/admin\/matches\/[^/?#]+$/);
    await expect(page.getByRole("heading", { name: "Record a delivery" })).toBeVisible();

    // The console defaults to the current striker and last bowler; a four only needs one click.
    // The native radio is visually hidden (sr-only), so the labelled control is clicked instead.
    await page
      .locator("fieldset", { hasText: "Runs off the bat" })
      .getByText("4", { exact: true })
      .click();
    await page.getByRole("button", { name: "Record ball" }).click();

    await expect(page.getByText(/Recorded .*4 run\(s\)/i)).toBeVisible();

    const before = await page.getByText(/Recorded/i).first().textContent();
    expect(before).toBeTruthy();

    await page.getByRole("button", { name: "Undo last delivery" }).click();
    await expect(page.getByText(/Last delivery removed/i)).toBeVisible();
  });

  test("fixture creation validates required fields", async ({ page }) => {
    await page.goto("/auth/login?next=%2Fadmin%2Fmatches%2Fnew");
    await page.getByLabel("Email address").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/admin\/matches\/new$/);
    await page.getByRole("heading", { name: "Create fixture" }).waitFor();

    // Submit with no team/venue selection: the browser's `required` attributes should block it.
    await page.getByRole("button", { name: /Create fixture/i }).click();
    await expect(page.getByRole("heading", { name: "Create fixture" })).toBeVisible();

    const teamA = page.getByLabel("Home team");
    const teamB = page.getByLabel("Away team");
    await teamA.selectOption({ index: 1 });
    await teamB.selectOption({ index: 2 });
    await page.getByLabel("Venue").selectOption({ index: 1 });
    await page.getByLabel(/Start time/).fill("2026-12-01T14:00");

    await page.getByRole("button", { name: /Create fixture/i }).click();
    await expect(page).toHaveURL(/\/admin\/matches\/[^/?#]+\?message=/);
  });
});
