import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalAction, internalMutation } from "./_generated/server";

import { getViewerIdentity } from "./lib/auth";
import { nowIso } from "./lib/time";

export const createWorkflowRecord = internalMutation({
  args: {
    kind: v.union(
      v.literal("artifact_generation"),
      v.literal("weekly_digest"),
      v.literal("support_follow_up"),
      v.literal("billing_sync"),
    ),
    profileId: v.id("profiles"),
    projectId: v.optional(v.id("projects")),
    threadId: v.optional(v.string()),
    trigger: v.union(
      v.literal("user"),
      v.literal("schedule"),
      v.literal("webhook"),
      v.literal("operator"),
    ),
  },
  handler: async (ctx, args): Promise<Id<"workflowRuns">> => {
    const now = nowIso();
    return ctx.db.insert("workflowRuns", {
      createdAt: now,
      kind: args.kind,
      profileId: args.profileId,
      projectId: args.projectId,
      status: "queued",
      threadId: args.threadId,
      trigger: args.trigger,
      updatedAt: now,
    });
  },
});

export const markWorkflowStatus = internalMutation({
  args: {
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("awaiting_input"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    workflowRunId: v.id("workflowRuns"),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.workflowRunId, {
      status: args.status,
      updatedAt: nowIso(),
    });
  },
});

export const runArtifactWorkflow = internalAction({
  args: {
    profileId: v.id("profiles"),
    projectId: v.optional(v.id("projects")),
    prompt: v.string(),
    title: v.string(),
    workflowRunId: v.id("workflowRuns"),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.workflows.markWorkflowStatus, {
      status: "running",
      workflowRunId: args.workflowRunId,
    });

    await ctx.runMutation(internal.artifacts.createGeneratedArtifact, {
      body: `Generated from workflow prompt: ${args.prompt}`,
      kind: "brief",
      profileId: args.profileId,
      projectId: args.projectId,
      title: args.title,
      workflowRunId: args.workflowRunId,
    });

    await ctx.runMutation(internal.notifications.enqueueNotification, {
      body: "A workflow completed and produced a fresh artifact.",
      channel: "push",
      profileId: args.profileId,
      title: "Artifact ready",
    });

    await ctx.runMutation(internal.workflows.markWorkflowStatus, {
      status: "completed",
      workflowRunId: args.workflowRunId,
    });
  },
});

export const scheduleWeeklyDigest = action({
  args: {},
  handler: async (ctx): Promise<Id<"workflowRuns">> => {
    const viewer = await getViewerIdentity(ctx);
    const profile: Doc<"profiles"> | null = await ctx.runQuery(
      internal.agent.resolveProfileByClerkUserId,
      {
        clerkUserId: viewer.clerkUserId,
      },
    );
    if (profile === null) {
      throw new Error(
        "Bootstrap the viewer profile before scheduling workflows",
      );
    }

    const workflowRunId: Id<"workflowRuns"> = await ctx.runMutation(
      internal.workflows.createWorkflowRecord,
      {
        kind: "weekly_digest",
        profileId: profile._id,
        trigger: "schedule",
      },
    );

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.enqueueNotification,
      {
        body: "Weekly digest scheduled. In production this would compile goals, artifacts, and billing state.",
        channel: "push",
        deepLink: "/notifications",
        profileId: profile._id,
        title: "Digest scheduled",
      },
    );

    return workflowRunId;
  },
});
