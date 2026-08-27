import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

import { getViewerProfile, requireViewerProfile } from "./lib/auth";
import { nowIso } from "./lib/time";

export const listApprovals = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);
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
    const profile = await requireViewerProfile(ctx);

    const approval = await ctx.db.get(args.approvalId);
    if (approval === null || approval.profileId !== profile._id) {
      throw new Error("Approval not found for this user");
    }

    if (approval.status !== "pending") {
      throw new Error(
        `Approval was already ${approval.status}; only pending approvals can be decided`,
      );
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
    riskLevel: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    title: v.string(),
    toolRunId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("approvals", {
      createdAt: nowIso(),
      description: args.description,
      profileId: args.profileId,
      riskLevel: args.riskLevel ?? "high",
      status: "pending",
      title: args.title,
      toolRunId: args.toolRunId,
    });
  },
});
