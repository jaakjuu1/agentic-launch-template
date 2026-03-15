import { describe, expect, it } from "vitest";

import { canAccessFeature, mergeEntitlements } from "./index";

describe("billing logic", () => {
  it("prefers the highest active tier", () => {
    const summary = mergeEntitlements([
      {
        id: "ent_free",
        profileId: "profile_demo",
        source: "stripe",
        tier: "pro",
        productKey: "pro_monthly",
        active: true,
        createdAt: "2026-03-15T10:00:00.000Z",
        updatedAt: "2026-03-15T10:00:00.000Z",
        metadata: {},
      },
      {
        id: "ent_life",
        profileId: "profile_demo",
        source: "admin",
        tier: "lifetime",
        productKey: "lifetime_unlock",
        active: true,
        createdAt: "2026-03-15T10:00:00.000Z",
        updatedAt: "2026-03-15T10:00:00.000Z",
        metadata: {},
      },
    ]);

    expect(summary.activeTier).toBe("lifetime");
    expect(canAccessFeature(summary, "operator_support")).toBe(true);
  });
});
