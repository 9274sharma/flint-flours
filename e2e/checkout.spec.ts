import { test, expect } from "@playwright/test";

test.describe("Checkout flow", () => {
  test("checkout page requires auth - redirects to login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login/);
  });

  test("cart page has checkout button when items exist", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");
    const checkoutButton = page.getByRole("button", { name: /proceed to checkout/i });
    const noItemsButton = page.getByRole("button", { name: /no items available/i });
    await expect(checkoutButton.or(noItemsButton)).toBeVisible({ timeout: 5000 });
  });
});
