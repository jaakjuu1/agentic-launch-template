import { mutation, query } from "./_generated/server";
import { getOrCreateViewerProfile, getViewerIdentity } from "./lib/auth";
import { ensureDemoRecords } from "./lib/demo";
import { hydrateArtifactsWithFiles } from "./lib/storage";

export const bootstrapViewer = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getOrCreateViewerProfile(ctx);
    if (profile === null) {
      throw new Error("Failed to bootstrap viewer profile");
    }

    await ensureDemoRecords(ctx, profile._id);
    return profile;
  },
});

export const dashboard = query({
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
