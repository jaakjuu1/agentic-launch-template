import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const workspaceAlias = {
  "@launch/ai": resolve(__dirname, "packages/ai/src/index.ts"),
  "@launch/analytics": resolve(__dirname, "packages/analytics/src/index.ts"),
  "@launch/auth": resolve(__dirname, "packages/auth/src/index.ts"),
  "@launch/billing": resolve(__dirname, "packages/billing/src/index.ts"),
  // More specific subpath first: plain prefix aliasing would otherwise
  // rewrite "@launch/config/product" to ".../index.ts/product".
  "@launch/config/product": resolve(
    __dirname,
    "packages/config/src/product.ts",
  ),
  "@launch/config": resolve(__dirname, "packages/config/src/index.ts"),
  "@launch/design-tokens": resolve(
    __dirname,
    "packages/design-tokens/src/index.ts",
  ),
  "@launch/domain": resolve(__dirname, "packages/domain/src/index.ts"),
  "@launch/storage": resolve(__dirname, "packages/storage/src/index.ts"),
  "@launch/ui-native": resolve(__dirname, "packages/ui-native/src/index.tsx"),
  "@launch/ui-web": resolve(__dirname, "packages/ui-web/src/index.tsx"),
};

export default defineConfig({
  resolve: {
    alias: workspaceAlias,
  },
  test: {
    environment: "node",
    include: [
      "convex/**/*.test.ts",
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
      "tests/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
