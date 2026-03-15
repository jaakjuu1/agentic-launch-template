import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

import { getOrCreateViewerProfile, getViewerIdentity } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listEntitlements = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerIdentity(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_user_id", (query) =>
        query.eq("clerkUserId", viewer.clerkUserId),
      )
      .unique();

    if (profile === null) {
      return [];
    }

    return ctx.db
      .query("entitlements")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();
  },
});

export const grantPreviewPro = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getOrCreateViewerProfile(ctx);
    if (profile === null) {
      throw new Error("Unable to resolve viewer profile");
    }

    return ctx.db.insert("entitlements", {
      active: true,
      createdAt: nowIso(),
      metadata: { source: "preview_button" },
      productKey: "pro_monthly",
      profileId: profile._id,
      source: "admin",
      tier: "pro",
      updatedAt: nowIso(),
    });
  },
});

export const applyWebhookEntitlement = internalMutation({
  args: {
    active: v.boolean(),
    metadata: v.optional(v.any()),
    productKey: v.string(),
    profileId: v.id("profiles"),
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
      metadata: args.metadata,
      productKey: args.productKey,
      profileId: args.profileId,
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
