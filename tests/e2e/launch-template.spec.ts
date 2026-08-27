import { expect, type Page, test } from "@playwright/test";

// Relative import (not the workspace alias) so Playwright can transpile the
// config without a build step. Assertions derive from productConfig, so the
// suite keeps passing after a rebrand of packages/config/src/product.ts.
import { productConfig } from "../../packages/config/src/product";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// External font hosts are unreachable in offline CI; a failed stylesheet
// fetch is not an app bug.
const IGNORED_CONSOLE_PATTERNS = [
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(String(error));
  });
  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }
    const text = message.text();
    const url = message.location().url;
    if (
      IGNORED_CONSOLE_PATTERNS.some(
        (pattern) => pattern.test(text) || pattern.test(url),
      )
    ) {
      return;
    }
    errors.push(text);
  });
  return errors;
}

test("home renders product-config branding without console errors", async ({
  page,
}) => {
  const errors = collectErrors(page);

  await page.goto("/");

  // Nav wordmark comes from productConfig.name.
  await expect(
    page.getByRole("link", { name: productConfig.name, exact: true }),
  ).toBeVisible();

  // Hero title comes from productConfig.tagline.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    productConfig.tagline,
  );

  await expect(page.getByRole("link", { name: "Pricing" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("pricing lists every tier from the product config", async ({ page }) => {
  await page.goto("/pricing");

  for (const tier of productConfig.pricing.tiers) {
    // Case-insensitive: tier names render inside text-transform: uppercase.
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`^${escapeRegExp(tier.name)}$`, "i"),
      }),
    ).toBeVisible();
    await expect(page.getByText(tier.displayPrice).first()).toBeVisible();
  }
});

const operatorEnvConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CONVEX_URL,
);

test("operator page shows the setup card when env is missing", async ({
  page,
}) => {
  test.skip(
    operatorEnvConfigured,
    "Clerk + Convex env vars are set, so the live console renders instead.",
  );

  await page.goto("/operator");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const envVar of [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "NEXT_PUBLIC_CONVEX_URL",
  ]) {
    await expect(page.getByText(envVar, { exact: true })).toBeVisible();
  }
});
