import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

import { getViewerIdentity } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listNotifications = query({
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
      .query("notifications")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();
  },
});

export const enqueueNotification = internalMutation({
  args: {
    body: v.string(),
    channel: v.union(
      v.literal("in_app"),
      v.literal("push"),
      v.literal("email"),
    ),
    deepLink: v.optional(v.string()),
    profileId: v.id("profiles"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("notifications", {
      body: args.body,
      channel: args.channel,
      createdAt: nowIso(),
      deepLink: args.deepLink,
      profileId: args.profileId,
      title: args.title,
    });
  },
});
