import { expect, test } from "@playwright/test";

const ADMIN = { email: "admin@nplcrickethub.local", password: "demo-admin-password" };

test.describe("competition console", () => {
  test.use({ viewport: { width: 1440, height: 1200 } });

  test("admin can create a season and a venue", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/auth/login?next=%2Fadmin%2Fcompetitions");
    await page.getByLabel("Email address").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/competitions$/);

    await expect(page.getByRole("heading", { name: "Competition setup" })).toBeVisible();
    await page.getByLabel("Season name").fill(`E2E Season ${stamp}`);
    await page.getByLabel("Year").fill("2031");
    await page.getByLabel("Start date").fill("2031-01-01");
    await page.getByLabel("End date").fill("2031-02-01");
    await page.getByRole("button", { name: "Create season" }).click();
    await expect(page.getByText(/Season created/i)).toBeVisible();
    await expect(page.getByText(`E2E Season ${stamp}`)).toBeVisible();

    await page.goto("/admin/venues");
    await expect(page.getByRole("heading", { name: "Venues", exact: true })).toBeVisible();
    await page.getByLabel("Venue name").fill(`E2E Ground ${stamp}`);
    await page.getByLabel("City").first().fill("Kathmandu");
    await page.getByLabel("Capacity").first().fill("15000");
    await page.getByRole("button", { name: "Create venue" }).click();
    await expect(page.getByText(/Venue created/i)).toBeVisible();
    await expect(page.getByRole("table").getByText(`E2E Ground ${stamp}`)).toBeVisible();
  });
});
