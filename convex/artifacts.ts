import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

import { getViewerProfile } from "./lib/auth";
import { hydrateArtifactsWithFiles } from "./lib/storage";
import { nowIso } from "./lib/time";

export const listArtifacts = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);

    if (profile === null) {
      return [];
    }

    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();

    return hydrateArtifactsWithFiles(ctx.db, artifacts);
  },
});

export const createGeneratedArtifact = internalMutation({
  args: {
    body: v.string(),
    kind: v.union(
      v.literal("plan"),
      v.literal("brief"),
      v.literal("draft"),
      v.literal("image"),
      v.literal("report"),
    ),
    profileId: v.id("profiles"),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    workflowRunId: v.optional(v.id("workflowRuns")),
  },
  handler: async (ctx, args) => {
    const now = nowIso();
    return ctx.db.insert("artifacts", {
      body: args.body,
      createdAt: now,
      kind: args.kind,
      profileId: args.profileId,
      projectId: args.projectId,
      status: "ready",
      title: args.title,
      updatedAt: now,
      workflowRunId: args.workflowRunId,
    });
  },
});
