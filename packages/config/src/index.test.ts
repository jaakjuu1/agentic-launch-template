import { describe, expect, it } from "vitest";

import { parseConvexEnv, parseProductEnv, parseWebEnv } from "./index";

describe("config parsers", () => {
  it("treats empty product env strings as optional values", () => {
    const parsed = parseProductEnv({
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      EXPO_PUBLIC_CONVEX_URL: "",
      EXPO_PUBLIC_ENABLE_MOCKS: "true",
    });

    expect(parsed.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY).toBeUndefined();
    expect(parsed.EXPO_PUBLIC_CONVEX_URL).toBeUndefined();
    expect(parsed.EXPO_PUBLIC_ENABLE_MOCKS).toBe(true);
  });

  it("accepts optional web provider secrets when unset", () => {
    const parsed = parseWebEnv({
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
      RESEND_API_KEY: "",
      SENTRY_DSN: "",
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
    });

    expect(parsed.NEXT_PUBLIC_CONVEX_URL).toBe("https://example.convex.cloud");
    expect(parsed.STRIPE_SECRET_KEY).toBeUndefined();
    expect(parsed.RESEND_API_KEY).toBeUndefined();
  });

  it("parses convex env without forcing provider credentials in development", () => {
    const parsed = parseConvexEnv({
      OPENAI_API_KEY: "",
      POSTHOG_PROJECT_API_KEY: "",
      STRIPE_SECRET_KEY: "",
    });

    expect(parsed.OPENAI_API_KEY).toBeUndefined();
    expect(parsed.POSTHOG_PROJECT_API_KEY).toBeUndefined();
    expect(parsed.STRIPE_SECRET_KEY).toBeUndefined();
  });
});
