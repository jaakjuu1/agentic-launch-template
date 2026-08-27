import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

import { getOrCreateViewerProfile, getViewerProfile } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listSupportRequests = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);

    if (profile === null) {
      return [];
    }

    return ctx.db
      .query("supportRequests")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();
  },
});

export const createSupportRequest = mutation({
  args: {
    body: v.string(),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateViewerProfile(ctx);

    const now = nowIso();
    const supportId = await ctx.db.insert("supportRequests", {
      body: args.body,
      createdAt: now,
      profileId: profile._id,
      status: "open",
      subject: args.subject,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.enqueueNotification,
      {
        body: "We received your support request and routed it to the operator console.",
        channel: "email",
        profileId: profile._id,
        title: "Support request received",
      },
    );

    return supportId;
  },
});
