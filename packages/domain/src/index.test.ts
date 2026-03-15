import { describe, expect, it } from "vitest";

import {
  analyticsEventSchema,
  entitlementSchema,
  profileSchema,
  seedPreview,
} from "./index";

describe("domain schemas", () => {
  it("validates the preview profile", () => {
    expect(profileSchema.parse(seedPreview.profile).email).toBe(
      "june@example.com",
    );
  });

  it("requires analytics versioning", () => {
    const parsed = analyticsEventSchema.parse({
      name: "goal_created",
      occurredAt: "2026-03-15T10:00:00.000Z",
      version: "2026-03",
      properties: { source: "onboarding" },
    });

    expect(parsed.version).toBe("2026-03");
  });

  it("tracks entitlement metadata for auditability", () => {
    const entitlement = entitlementSchema.parse({
      id: "ent_demo",
      profileId: "profile_demo",
      source: "stripe",
      tier: "pro",
      productKey: "pro_monthly",
      active: true,
      metadata: { checkoutSessionId: "cs_demo" },
      createdAt: "2026-03-15T10:00:00.000Z",
      updatedAt: "2026-03-15T10:00:00.000Z",
    });

    expect(entitlement.metadata).toMatchObject({
      checkoutSessionId: "cs_demo",
    });
  });
});
