import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("loads and shows header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation").getByRole("link", { name: /shop/i })).toBeVisible();
  });

  test("shows main content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/what our customers say/i)).toBeVisible({ timeout: 10000 });
  });
});
