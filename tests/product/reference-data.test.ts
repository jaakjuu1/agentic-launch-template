import { describe, expect, it } from "vitest";

import {
  onboardingEvent,
  referenceEntitlements,
  referenceNotifications,
  referenceProjects,
  referenceThread,
} from "../../apps/product/lib/reference-data";

describe("product reference data", () => {
  it("ships seeded dashboard content for the launch template", () => {
    expect(referenceProjects).toHaveLength(3);
    expect(referenceThread.messages).toHaveLength(3);
    expect(referenceNotifications[0]?.title).toBe("Artifact ready");
  });

  it("keeps entitlement and analytics examples aligned with shared contracts", () => {
    expect(referenceEntitlements.activeTier).toBe("pro");
    expect(onboardingEvent.version).toBe("2026-03");
  });
});
