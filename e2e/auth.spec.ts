import { test, expect } from "@playwright/test";

test.describe("Auth flows", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/welcome back|sign in/i)).toBeVisible();
  });

  test("login page has sign in button", async ({ page }) => {
    await page.goto("/login");
    const signInButton = page.getByTestId("sign-in-google");
    await expect(signInButton).toBeVisible({ timeout: 5000 });
  });

  test("redirects to login when accessing protected account page", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects to login when accessing checkout", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login/);
  });
});
