import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

import { getOrCreateViewerProfile, getViewerIdentity } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listApprovals = query({
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
      .query("approvals")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .collect();
  },
});

export const decideApproval = mutation({
  args: {
    approvalId: v.id("approvals"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateViewerProfile(ctx);
    if (profile === null) {
      throw new Error("Unable to resolve viewer profile");
    }

    await ctx.db.patch(args.approvalId, {
      decidedAt: nowIso(),
      decidedBy: profile._id,
      status: args.decision,
    });

    return ctx.db.get(args.approvalId);
  },
});

export const requestApproval = internalMutation({
  args: {
    description: v.string(),
    profileId: v.id("profiles"),
    title: v.string(),
    toolRunId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("approvals", {
      createdAt: nowIso(),
      description: args.description,
      profileId: args.profileId,
      riskLevel: "high",
      status: "pending",
      title: args.title,
      toolRunId: args.toolRunId,
    });
  },
});
