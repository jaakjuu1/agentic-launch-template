import { mutation, query } from "./_generated/server";
import { getOrCreateViewerProfile, getViewerProfile } from "./lib/auth";
import { ensureDemoRecords } from "./lib/demo";
import { isDemoMode } from "./lib/env";
import { hydrateArtifactsWithFiles } from "./lib/storage";

/**
 * Idempotent post-sign-in bootstrap: ensures the viewer profile exists.
 * In demo mode it also seeds example records so a fresh clone has
 * something to show; real deployments never receive seed data.
 */
export const bootstrapViewer = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getOrCreateViewerProfile(ctx);

    if (isDemoMode()) {
      await ensureDemoRecords(ctx, profile._id);
    }

    return profile;
  },
});

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);

    if (profile === null) {
      return {
        approvals: [],
        artifacts: [],
        goals: [],
        notifications: [],
        profile: null,
        projects: [],
      };
    }

    const [goals, notifications, projects, approvals, artifacts] =
      await Promise.all([
        ctx.db
          .query("goals")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
        ctx.db
          .query("notifications")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
        ctx.db
          .query("projects")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
        ctx.db
          .query("approvals")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
        ctx.db
          .query("artifacts")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
      ]);

    return {
      approvals,
      artifacts: await hydrateArtifactsWithFiles(ctx.db, artifacts),
      goals,
      notifications,
      profile,
      projects,
    };
  },
});
