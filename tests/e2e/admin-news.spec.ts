import { expect, test } from "@playwright/test";

const EDITOR = { email: "editor@nplcrickethub.local", password: "demo-editor-password" };

const unique = (prefix: string) => `${prefix}-${Date.now()}`;

test.describe("editorial console", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test("creates a draft and publishes it end to end", async ({ page }) => {
    const slug = unique("e2e-article");

    await page.goto("/auth/login?next=%2Fadmin%2Fnews%2Fnew");
    await page.getByLabel("Email address").fill(EDITOR.email);
    await page.getByLabel("Password").fill(EDITOR.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/news\/new$/);

    await page.getByLabel("Headline").fill("End-to-end test article");
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Summary").fill("A scripted end-to-end article used to verify the editorial workflow.");
    await page
      .getByLabel("Body (Markdown subset)")
      .fill(
        "## End-to-end verification\n\nThis paragraph exists to satisfy the minimum body length requirement of the editorial form while the Playwright suite exercises publishing.",
      );
    await page.getByLabel("Category").selectOption({ index: 0 });
    await page.getByLabel("Status").selectOption("published");
    await page.getByRole("button", { name: "Create article" }).click();

    await expect(page).toHaveURL(/\/admin\/news\?message=/);
    await expect(page.getByText(/created\./i)).toBeVisible();

    // The published article must be visible on the public site.
    await page.goto(`/news/${slug}`);
    await expect(page.getByRole("heading", { name: "End-to-end test article" })).toBeVisible();

    // And manageable from the editorial list.
    await page.goto("/admin/news");
    await page
      .locator("tr", { hasText: "End-to-end test article" })
      .getByRole("link", { name: /Edit/i })
      .click();
    await expect(page.getByRole("heading", { name: "Edit article" })).toBeVisible();
    await expect(page.getByLabel("Slug")).toHaveValue(slug);
  });

  test("pending comments surface in the moderation view", async ({ page }) => {
    await page.goto("/auth/login?next=%2Fadmin%2Fcomments");
    await page.getByLabel("Email address").fill(EDITOR.email);
    await page.getByLabel("Password").fill(EDITOR.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/comments$/);
    await expect(page.getByRole("heading", { name: "Comment moderation" })).toBeVisible();
  });
});
