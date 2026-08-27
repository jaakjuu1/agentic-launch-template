import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { getOrCreateViewerProfile, getViewerProfile } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listGoals = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);

    if (profile === null) {
      return [];
    }

    return ctx.db
      .query("goals")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();
  },
});

export const createGoal = mutation({
  args: {
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateViewerProfile(ctx);

    const now = nowIso();
    return ctx.db.insert("goals", {
      createdAt: now,
      description: args.description ?? "",
      priority: args.priority,
      profileId: profile._id,
      status: "active",
      title: args.title,
      updatedAt: now,
    });
  },
});
