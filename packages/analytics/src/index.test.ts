import { describe, expect, it, vi } from "vitest";

import {
  buildAnalyticsEvent,
  fanOutAnalyticsEvent,
  toPosthogCapture,
} from "./index";

describe("analytics helpers", () => {
  it("defaults the analytics schema version", () => {
    const event = buildAnalyticsEvent({
      name: "goal_created",
      occurredAt: "2026-03-15T10:00:00.000Z",
      properties: { source: "seed" },
      userId: "profile_demo",
    });

    expect(event.version).toBe("2026-03");
  });

  it("fans out to every sink", async () => {
    const sinkA = vi.fn();
    const sinkB = vi.fn();
    const event = buildAnalyticsEvent({
      name: "app_opened",
      occurredAt: "2026-03-15T10:00:00.000Z",
      properties: {},
      userId: "profile_demo",
    });

    await fanOutAnalyticsEvent(event, [sinkA, sinkB]);

    expect(sinkA).toHaveBeenCalledTimes(1);
    expect(sinkB).toHaveBeenCalledTimes(1);
  });

  it("maps to a PostHog capture payload", () => {
    const payload = toPosthogCapture(
      buildAnalyticsEvent({
        name: "paywall_viewed",
        occurredAt: "2026-03-15T10:00:00.000Z",
        properties: { placement: "home" },
      }),
    );

    expect(payload.event).toBe("paywall_viewed");
    expect(payload.distinctId).toBe("anonymous");
  });
});
