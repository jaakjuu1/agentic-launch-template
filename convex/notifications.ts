import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

import { getViewerProfile, requireViewerProfile } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listNotifications = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);
    if (profile === null) {
      return [];
    }

    return ctx.db
      .query("notifications")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const profile = await requireViewerProfile(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (notification === null || notification.profileId !== profile._id) {
      throw new Error("Notification not found for this user");
    }

    if (notification.readAt === undefined) {
      await ctx.db.patch(args.notificationId, { readAt: nowIso() });
    }

    return ctx.db.get(args.notificationId);
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireViewerProfile(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_profile_read", (query) =>
        query.eq("profileId", profile._id).eq("readAt", undefined),
      )
      .collect();

    const now = nowIso();
    await Promise.all(
      unread.map((notification) =>
        ctx.db.patch(notification._id, { readAt: now }),
      ),
    );

    return { marked: unread.length };
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
