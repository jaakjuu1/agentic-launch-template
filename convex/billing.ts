import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

import { getOrCreateViewerProfile, getViewerProfile } from "./lib/auth";
import { isDemoMode } from "./lib/env";
import { nowIso } from "./lib/time";

export const listEntitlements = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);
    if (profile === null) {
      return [];
    }

    return ctx.db
      .query("entitlements")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();
  },
});

/**
 * Demo-mode-only shortcut for exploring pro features without a billing
 * provider. Disabled unless DEMO_MODE=true on the deployment; real
 * entitlements come exclusively from verified Stripe/RevenueCat webhooks.
 */
export const grantPreviewPro = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"entitlements">> => {
    if (!isDemoMode()) {
      throw new Error(
        "grantPreviewPro is only available when DEMO_MODE=true. Production entitlements are granted by billing webhooks.",
      );
    }

    const profile = await getOrCreateViewerProfile(ctx);
    return ctx.runMutation(internal.billing.applyWebhookEntitlement, {
      active: true,
      metadata: { source: "preview_button" },
      productKey: "pro_monthly",
      profileId: profile._id,
      source: "admin",
      tier: "pro",
    });
  },
});

const entitlementUpdateArgs = {
  active: v.boolean(),
  clerkUserId: v.string(),
  expiresAt: v.optional(v.string()),
  metadata: v.optional(v.any()),
  originalTransactionId: v.optional(v.string()),
  productKey: v.string(),
  renewsAt: v.optional(v.string()),
  source: v.union(v.literal("stripe"), v.literal("revenuecat")),
  tier: v.union(v.literal("free"), v.literal("pro"), v.literal("lifetime")),
};

/**
 * Apply an entitlement update from a verified billing webhook, keyed by
 * Clerk user id. Missing profiles are created lazily so a purchase that
 * races profile bootstrap is not lost.
 */
export const applyEntitlementForClerkUser = internalMutation({
  args: entitlementUpdateArgs,
  handler: async (ctx, args): Promise<Id<"entitlements">> => {
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_user_id", (query) =>
        query.eq("clerkUserId", args.clerkUserId),
      )
      .unique();

    if (profile === null) {
      const now = nowIso();
      const profileId = await ctx.db.insert("profiles", {
        analyticsConsent: false,
        clerkUserId: args.clerkUserId,
        createdAt: now,
        email: "",
        firstName: "Member",
        locale: "en-US",
        marketingConsent: false,
        role: "consumer",
        timezone: "UTC",
        updatedAt: now,
      });
      profile = await ctx.db.get(profileId);
    }

    if (profile === null) {
      throw new Error("Unable to resolve profile for entitlement update");
    }

    return ctx.runMutation(internal.billing.applyWebhookEntitlement, {
      active: args.active,
      expiresAt: args.expiresAt,
      metadata: args.metadata,
      originalTransactionId: args.originalTransactionId,
      productKey: args.productKey,
      profileId: profile._id,
      renewsAt: args.renewsAt,
      source: args.source,
      tier: args.tier,
    });
  },
});

export const applyWebhookEntitlement = internalMutation({
  args: {
    active: v.boolean(),
    expiresAt: v.optional(v.string()),
    metadata: v.optional(v.any()),
    originalTransactionId: v.optional(v.string()),
    productKey: v.string(),
    profileId: v.id("profiles"),
    renewsAt: v.optional(v.string()),
    source: v.union(
      v.literal("stripe"),
      v.literal("revenuecat"),
      v.literal("admin"),
    ),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("lifetime")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("entitlements")
      .withIndex("by_profile_product", (query) =>
        query.eq("profileId", args.profileId).eq("productKey", args.productKey),
      )
      .unique();

    const payload = {
      active: args.active,
      expiresAt: args.expiresAt,
      metadata: args.metadata,
      originalTransactionId: args.originalTransactionId,
      productKey: args.productKey,
      profileId: args.profileId,
      renewsAt: args.renewsAt,
      source: args.source,
      tier: args.tier,
      updatedAt: nowIso(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return ctx.db.insert("entitlements", {
      ...payload,
      createdAt: nowIso(),
    });
  },
});
