import { test, expect } from "@playwright/test";

test.describe("Shop page", () => {
  test("loads shop page", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveURL(/\/shop/);
  });

  test("shows product grid or empty state", async ({ page }) => {
    await page.goto("/shop");
    const hasProducts = await page.getByRole("button", { name: /add to cart|out of stock/i }).count() > 0;
    const hasEmpty = await page.getByText(/no products found/i).count() > 0;
    expect(hasProducts || hasEmpty).toBeTruthy();
  });
});
