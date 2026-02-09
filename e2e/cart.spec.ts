import { test, expect } from "@playwright/test";

test.describe("Cart page", () => {
  test("loads cart page", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart/);
  });

  test("shows empty cart state when no items", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText(/cart/i)).toBeVisible();
    const emptyState = page.getByText(/your cart is empty|loading cart/i);
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test("has link to shop when cart is empty", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");
    const shopLink = page.getByRole("link", { name: /continue shopping/i });
    await expect(shopLink).toBeVisible({ timeout: 5000 });
  });
});
