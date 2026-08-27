import {
  getTierByProductKey,
  getTierByRevenuecatEntitlement,
} from "@launch/config/product";

/**
 * Pure mapping from verified billing webhook payloads to entitlement
 * updates. Kept free of Convex imports so it can be unit-tested directly.
 *
 * Contract with the checkout integrations (see docs/integrations.md):
 * - Stripe Checkout Sessions are created with
 *   `client_reference_id = <clerkUserId>` and
 *   `metadata.productKey = <pricing tier productKey>`, and subscriptions
 *   inherit both via `subscription_data.metadata`.
 * - RevenueCat is logged in with `Purchases.logIn(<clerkUserId>)`, so
 *   `app_user_id` is the Clerk user id.
 */

export type EntitlementUpdate = {
  active: boolean;
  clerkUserId: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  originalTransactionId?: string;
  productKey: string;
  renewsAt?: string;
  source: "stripe" | "revenuecat";
  tier: "free" | "pro" | "lifetime";
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function secondsToIso(value: unknown): string | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : undefined;
}

function millisToIso(value: unknown): string | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value).toISOString()
    : undefined;
}

const ACTIVE_STRIPE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

/**
 * Map a Stripe event to an entitlement update, or null when the event is
 * not entitlement-relevant (unhandled type, or missing user linkage).
 */
export function stripeEventToEntitlementUpdate(
  event: unknown,
): EntitlementUpdate | null {
  const eventRecord = asRecord(event);
  const type = asString(eventRecord?.type);
  const object = asRecord(asRecord(eventRecord?.data)?.object);
  if (!type || !object) {
    return null;
  }

  const metadata = asRecord(object.metadata) ?? {};
  const productKey = asString(metadata.productKey) ?? "pro_monthly";
  const tier = getTierByProductKey(productKey)?.tier ?? "pro";

  if (type === "checkout.session.completed") {
    const clerkUserId =
      asString(object.client_reference_id) ?? asString(metadata.clerkUserId);
    if (!clerkUserId) {
      return null;
    }

    return {
      active: true,
      clerkUserId,
      metadata: { checkoutSessionId: asString(object.id) },
      originalTransactionId:
        asString(object.subscription) ?? asString(object.id),
      productKey,
      source: "stripe",
      tier,
    };
  }

  if (
    type === "customer.subscription.updated" ||
    type === "customer.subscription.deleted"
  ) {
    const clerkUserId = asString(metadata.clerkUserId);
    if (!clerkUserId) {
      return null;
    }

    const status = asString(object.status) ?? "canceled";
    const active =
      type === "customer.subscription.deleted"
        ? false
        : ACTIVE_STRIPE_SUBSCRIPTION_STATUSES.has(status);

    return {
      active,
      clerkUserId,
      metadata: { subscriptionStatus: status },
      originalTransactionId: asString(object.id),
      productKey,
      renewsAt: secondsToIso(object.current_period_end),
      source: "stripe",
      tier,
    };
  }

  return null;
}

const ACTIVATING_REVENUECAT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "NON_RENEWING_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "TRANSFER",
]);

/**
 * Map a RevenueCat event to an entitlement update, or null for event
 * types that don't change entitlement state (e.g. CANCELLATION only turns
 * off auto-renew — access lasts until EXPIRATION).
 */
export function revenuecatEventToEntitlementUpdate(
  payload: unknown,
): EntitlementUpdate | null {
  const event = asRecord(asRecord(payload)?.event);
  const type = asString(event?.type);
  const clerkUserId = asString(event?.app_user_id);
  if (!event || !type || !clerkUserId) {
    return null;
  }

  const entitlementIds = Array.isArray(event.entitlement_ids)
    ? event.entitlement_ids.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const entitlementId = entitlementIds[0] ?? "pro";
  const tierConfig = getTierByRevenuecatEntitlement(entitlementId);
  const productKey = tierConfig?.productKey ?? "pro_monthly";
  const tier = tierConfig?.tier ?? "pro";

  const base = {
    clerkUserId,
    expiresAt: millisToIso(event.expiration_at_ms),
    metadata: {
      entitlementIds,
      eventType: type,
      store: asString(event.store),
    },
    originalTransactionId:
      asString(event.original_transaction_id) ?? asString(event.transaction_id),
    productKey,
    source: "revenuecat" as const,
    tier,
  };

  if (ACTIVATING_REVENUECAT_EVENTS.has(type)) {
    return { ...base, active: true };
  }

  if (type === "EXPIRATION") {
    return { ...base, active: false };
  }

  return null;
}
