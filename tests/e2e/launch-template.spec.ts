import { expect, test } from "@playwright/test";

test("public site exposes launch-template entry points", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Build the app you wish existed/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Read setup docs" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore operator console" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Pricing" })).toBeVisible();
});
