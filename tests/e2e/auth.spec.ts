import { expect, test } from "@playwright/test";

const ADMIN = { email: "admin@nplcrickethub.local", password: "demo-admin-password" };
const FAN = { email: "fan@nplcrickethub.local", password: "demo-fan-password" };

test.describe("authentication and authorisation", () => {
  test("unauthenticated admin access is redirected to sign in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("admin can sign in, open the console and sign out", async ({ page }) => {
    await page.goto("/auth/login?next=%2Fadmin");
    await page.getByLabel("Email address").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good|Admin/);
    await expect(page.getByText("Live matches").first()).toBeVisible();

    await page.goto("/admin/system");
    await expect(page.getByRole("heading", { name: "System health" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Runtime configuration" })).toBeVisible();

    await page.getByRole("button", { name: /Sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("fan sign-in lands in the fan zone", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email address").fill(FAN.email);
    await page.getByLabel("Password").fill(FAN.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/fan-zone/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("invalid credentials are rejected", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email address").fill(FAN.email);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });
});
