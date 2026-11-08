import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          // Opening the login limiter so a whole suite of sign-ins is not throttled.
          LOGIN_RATE_LIMIT_MAX: "1000000",
          // Keep browser tests deterministic even when .env.local contains a project.
          // The app rejects this non-Supabase host and therefore uses its demo fixture.
          NEXT_PUBLIC_SUPABASE_URL: "https://playwright.invalid",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-e2e-key",
          SUPABASE_SERVICE_ROLE_KEY: "placeholder-e2e-secret",
          SUPABASE_URL_ALLOW_CUSTOM: "false",
          NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
          AUTH_SECRET: "e2e-only-signed-cookie-secret",
          ADMIN_EMAIL: "admin@nplcrickethub.local",
          ADMIN_PASSWORD: "demo-admin-password",
          EDITOR_EMAIL: "editor@nplcrickethub.local",
          EDITOR_PASSWORD: "demo-editor-password",
          FAN_EMAIL: "fan@nplcrickethub.local",
          FAN_PASSWORD: "demo-fan-password",
          NEXT_DIST_DIR: ".next-e2e",
        },
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec\.ts/ },
  ],
});
