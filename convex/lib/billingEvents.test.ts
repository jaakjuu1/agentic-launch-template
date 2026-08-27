import { describe, expect, it } from "vitest";

import {
  revenuecatEventToEntitlementUpdate,
  stripeEventToEntitlementUpdate,
} from "./billingEvents";

describe("stripe event mapping", () => {
  it("activates an entitlement from checkout.session.completed", () => {
    const update = stripeEventToEntitlementUpdate({
      data: {
        object: {
          client_reference_id: "user_123",
          id: "cs_test_1",
          metadata: { productKey: "pro_monthly" },
          subscription: "sub_1",
        },
      },
      id: "evt_1",
      type: "checkout.session.completed",
    });

    expect(update).toMatchObject({
      active: true,
      clerkUserId: "user_123",
      productKey: "pro_monthly",
      source: "stripe",
      tier: "pro",
    });
  });

  it("deactivates on subscription deletion", () => {
    const update = stripeEventToEntitlementUpdate({
      data: {
        object: {
          id: "sub_1",
          metadata: { clerkUserId: "user_123", productKey: "pro_monthly" },
          status: "canceled",
        },
      },
      id: "evt_2",
      type: "customer.subscription.deleted",
    });

    expect(update).toMatchObject({ active: false, clerkUserId: "user_123" });
  });

  it("ignores events without user linkage or unknown types", () => {
    expect(
      stripeEventToEntitlementUpdate({
        data: { object: { id: "cs_x", metadata: {} } },
        type: "checkout.session.completed",
      }),
    ).toBeNull();
    expect(
      stripeEventToEntitlementUpdate({
        data: { object: {} },
        type: "invoice.paid",
      }),
    ).toBeNull();
  });
});

describe("revenuecat event mapping", () => {
  it("activates on purchase and maps the entitlement id to a tier", () => {
    const update = revenuecatEventToEntitlementUpdate({
      event: {
        app_user_id: "user_123",
        entitlement_ids: ["pro"],
        expiration_at_ms: 1_800_000_000_000,
        id: "rc_evt_1",
        store: "APP_STORE",
        type: "INITIAL_PURCHASE",
      },
    });

    expect(update).toMatchObject({
      active: true,
      clerkUserId: "user_123",
      productKey: "pro_monthly",
      source: "revenuecat",
      tier: "pro",
    });
    expect(update?.expiresAt).toBe(new Date(1_800_000_000_000).toISOString());
  });

  it("deactivates on expiration and ignores cancellation", () => {
    expect(
      revenuecatEventToEntitlementUpdate({
        event: {
          app_user_id: "user_123",
          entitlement_ids: ["pro"],
          id: "rc_evt_2",
          type: "EXPIRATION",
        },
      }),
    ).toMatchObject({ active: false });

    expect(
      revenuecatEventToEntitlementUpdate({
        event: {
          app_user_id: "user_123",
          entitlement_ids: ["pro"],
          id: "rc_evt_3",
          type: "CANCELLATION",
        },
      }),
    ).toBeNull();
  });
});
