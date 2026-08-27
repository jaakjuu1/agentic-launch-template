import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";

import { getOrCreateViewerProfile, getViewerProfile } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);
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

/**
 * Internal: validate a model- or client-supplied project id string and
 * return it only when it parses and belongs to the given profile.
 */
export const resolveOwnedProjectId = internalQuery({
  args: {
    candidateId: v.string(),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args): Promise<Id<"projects"> | null> => {
    const projectId = ctx.db.normalizeId("projects", args.candidateId);
    if (projectId === null) {
      return null;
    }

    const project = await ctx.db.get(projectId);
    return project !== null && project.profileId === args.profileId
      ? projectId
      : null;
  },
});
