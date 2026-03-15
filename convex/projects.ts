import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { getOrCreateViewerProfile, getViewerIdentity } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listProjects = query({
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
      .query("projects")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();
  },
});

export const createProject = mutation({
  args: {
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateViewerProfile(ctx);
    if (profile === null) {
      throw new Error("Unable to resolve viewer profile");
    }

    const now = nowIso();
    return ctx.db.insert("projects", {
      createdAt: now,
      name: args.title,
      profileId: profile._id,
      progressPercent: 0,
      summary: args.summary ?? "",
      tags: args.tags ?? [],
      updatedAt: now,
    });
  },
});
