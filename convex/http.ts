import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

import {
  revenuecatEventToEntitlementUpdate,
  stripeEventToEntitlementUpdate,
} from "./lib/billingEvents";
import {
  getClerkWebhookSecret,
  getResendWebhookSecret,
  getRevenuecatWebhookAuthToken,
  getStripeWebhookSecret,
} from "./lib/env";
import {
  timingSafeEqualStrings,
  verifyStripeSignature,
  verifySvixSignature,
} from "./lib/webhooks";

const http = httpRouter();

const MAX_STORED_PAYLOAD_BYTES = 16 * 1024;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function parsePayload(payload: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Cap what lands in the audit log so webhooks can't bloat the database. */
function auditPayload(payload: string): unknown {
  if (payload.length > MAX_STORED_PAYLOAD_BYTES) {
    return { bytes: payload.length, truncated: true };
  }

  return parsePayload(payload) ?? { bytes: payload.length, unparsable: true };
}

async function verifySvixRequest(
  request: Request,
  secret: string,
  payload: string,
): Promise<boolean> {
  return verifySvixSignature({
    payload,
    secret,
    svixId: request.headers.get("svix-id"),
    svixSignature: request.headers.get("svix-signature"),
    svixTimestamp: request.headers.get("svix-timestamp"),
  });
}

function clerkPrimaryEmail(data: Record<string, unknown>): string {
  const emailAddresses = Array.isArray(data.email_addresses)
    ? (data.email_addresses as Array<Record<string, unknown>>)
    : [];
  const primaryId =
    typeof data.primary_email_address_id === "string"
      ? data.primary_email_address_id
      : undefined;
  const primary =
    emailAddresses.find((entry) => entry.id === primaryId) ?? emailAddresses[0];
  return typeof primary?.email_address === "string"
    ? primary.email_address
    : "";
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Clerk → profile sync. Configure the endpoint in the Clerk dashboard
 * (Webhooks → add `https://<deployment>.convex.site/webhooks/clerk`,
 * subscribe to user.created / user.updated / user.deleted) and set
 * CLERK_WEBHOOK_SECRET on the Convex deployment.
 */
http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = getClerkWebhookSecret();
    if (!secret) {
      return jsonResponse(503, { error: "CLERK_WEBHOOK_SECRET is not set" });
    }

    const payload = await request.text();
    if (!(await verifySvixRequest(request, secret, payload))) {
      return jsonResponse(400, { error: "Invalid webhook signature" });
    }

    const event = parsePayload(payload);
    if (event === null) {
      return jsonResponse(400, { error: "Invalid JSON payload" });
    }

    const svixId = request.headers.get("svix-id");
    const eventType = optionalString(event.type) ?? "unknown";
    const { alreadyProcessed } = await ctx.runMutation(
      internal.audit.recordWebhookEvent,
      {
        dedupeKey: svixId ? `clerk:${svixId}` : undefined,
        payload: auditPayload(payload),
        source: "clerk",
        title: `Clerk webhook: ${eventType}`,
      },
    );

    if (alreadyProcessed) {
      return jsonResponse(200, { deduped: true, ok: true });
    }

    const data =
      typeof event.data === "object" && event.data !== null
        ? (event.data as Record<string, unknown>)
        : {};
    const clerkUserId = optionalString(data.id);

    if (
      clerkUserId &&
      (eventType === "user.created" || eventType === "user.updated")
    ) {
      const publicMetadata =
        typeof data.public_metadata === "object" &&
        data.public_metadata !== null
          ? (data.public_metadata as Record<string, unknown>)
          : {};
      await ctx.runMutation(internal.profiles.upsertFromClerk, {
        avatarUrl: optionalString(data.image_url),
        clerkUserId,
        email: clerkPrimaryEmail(data),
        firstName: optionalString(data.first_name),
        lastName: optionalString(data.last_name),
        roleClaim: optionalString(publicMetadata["app:role"]),
      });
    }

    if (clerkUserId && eventType === "user.deleted") {
      await ctx.runMutation(internal.profiles.deleteProfileCascade, {
        clerkUserId,
      });
    }

    return jsonResponse(200, { ok: true, provider: "clerk" });
  }),
});

/**
 * Stripe → entitlement sync. Point a Stripe webhook at
 * `https://<deployment>.convex.site/webhooks/stripe` with the events
 * `checkout.session.completed`, `customer.subscription.updated`, and
 * `customer.subscription.deleted`; set STRIPE_WEBHOOK_SECRET.
 */
http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = getStripeWebhookSecret();
    if (!secret) {
      return jsonResponse(503, { error: "STRIPE_WEBHOOK_SECRET is not set" });
    }

    const payload = await request.text();
    const verified = await verifyStripeSignature({
      payload,
      secret,
      signatureHeader: request.headers.get("stripe-signature"),
    });
    if (!verified) {
      return jsonResponse(400, { error: "Invalid webhook signature" });
    }

    const event = parsePayload(payload);
    if (event === null) {
      return jsonResponse(400, { error: "Invalid JSON payload" });
    }

    const eventId = optionalString(event.id);
    const eventType = optionalString(event.type) ?? "unknown";
    const { alreadyProcessed } = await ctx.runMutation(
      internal.audit.recordWebhookEvent,
      {
        dedupeKey: eventId ? `stripe:${eventId}` : undefined,
        payload: auditPayload(payload),
        source: "stripe",
        title: `Stripe webhook: ${eventType}`,
      },
    );

    if (alreadyProcessed) {
      return jsonResponse(200, { deduped: true, ok: true });
    }

    const update = stripeEventToEntitlementUpdate(event);
    if (update !== null) {
      await ctx.runMutation(internal.billing.applyEntitlementForClerkUser, {
        active: update.active,
        clerkUserId: update.clerkUserId,
        expiresAt: update.expiresAt,
        metadata: update.metadata,
        originalTransactionId: update.originalTransactionId,
        productKey: update.productKey,
        renewsAt: update.renewsAt,
        source: update.source,
        tier: update.tier,
      });
    }

    return jsonResponse(200, { ok: true, provider: "stripe" });
  }),
});

/**
 * RevenueCat → entitlement sync. In the RevenueCat dashboard set the
 * webhook URL to `https://<deployment>.convex.site/webhooks/revenuecat`
 * and an Authorization header value; mirror it in
 * REVENUECAT_WEBHOOK_AUTH_TOKEN.
 */
http.route({
  path: "/webhooks/revenuecat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedToken = getRevenuecatWebhookAuthToken();
    if (!expectedToken) {
      return jsonResponse(503, {
        error: "REVENUECAT_WEBHOOK_AUTH_TOKEN is not set",
      });
    }

    const authorization = request.headers.get("authorization") ?? "";
    const bareToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : authorization;
    if (
      !timingSafeEqualStrings(authorization, expectedToken) &&
      !timingSafeEqualStrings(bareToken, expectedToken)
    ) {
      return jsonResponse(401, { error: "Invalid authorization header" });
    }

    const payload = await request.text();
    const event = parsePayload(payload);
    if (event === null) {
      return jsonResponse(400, { error: "Invalid JSON payload" });
    }

    const eventRecord =
      typeof event.event === "object" && event.event !== null
        ? (event.event as Record<string, unknown>)
        : {};
    const eventId = optionalString(eventRecord.id);
    const eventType = optionalString(eventRecord.type) ?? "unknown";
    const { alreadyProcessed } = await ctx.runMutation(
      internal.audit.recordWebhookEvent,
      {
        dedupeKey: eventId ? `revenuecat:${eventId}` : undefined,
        payload: auditPayload(payload),
        source: "revenuecat",
        title: `RevenueCat webhook: ${eventType}`,
      },
    );

    if (alreadyProcessed) {
      return jsonResponse(200, { deduped: true, ok: true });
    }

    const update = revenuecatEventToEntitlementUpdate(event);
    if (update !== null) {
      await ctx.runMutation(internal.billing.applyEntitlementForClerkUser, {
        active: update.active,
        clerkUserId: update.clerkUserId,
        expiresAt: update.expiresAt,
        metadata: update.metadata,
        originalTransactionId: update.originalTransactionId,
        productKey: update.productKey,
        renewsAt: update.renewsAt,
        source: update.source,
        tier: update.tier,
      });
    }

    return jsonResponse(200, { ok: true, provider: "revenuecat" });
  }),
});

/**
 * Resend delivery events (audit trail only). Configure a webhook in the
 * Resend dashboard and set RESEND_WEBHOOK_SECRET (Resend signs with the
 * Svix scheme).
 */
http.route({
  path: "/webhooks/resend",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = getResendWebhookSecret();
    if (!secret) {
      return jsonResponse(503, { error: "RESEND_WEBHOOK_SECRET is not set" });
    }

    const payload = await request.text();
    if (!(await verifySvixRequest(request, secret, payload))) {
      return jsonResponse(400, { error: "Invalid webhook signature" });
    }

    const event = parsePayload(payload);
    const svixId = request.headers.get("svix-id");
    await ctx.runMutation(internal.audit.recordWebhookEvent, {
      dedupeKey: svixId ? `resend:${svixId}` : undefined,
      payload: auditPayload(payload),
      source: "resend",
      title: `Resend event: ${optionalString(event?.type) ?? "unknown"}`,
    });

    return jsonResponse(200, { ok: true, provider: "resend" });
  }),
});

export default http;
