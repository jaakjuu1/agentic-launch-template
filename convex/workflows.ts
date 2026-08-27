import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";

import { hasModelApiKey, resolveChatModel } from "./lib/ai";
import { getViewerIdentity } from "./lib/auth";
import { nowIso } from "./lib/time";

export const createWorkflowRecord = internalMutation({
  args: {
    kind: v.union(
      v.literal("artifact_generation"),
      v.literal("weekly_digest"),
      v.literal("support_follow_up"),
      v.literal("billing_sync"),
      v.literal("file_processing"),
      v.literal("file_cleanup"),
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
    lastError: v.optional(v.string()),
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
      lastError: args.lastError,
      status: args.status,
      updatedAt: nowIso(),
    });
  },
});

/**
 * Generate artifact content with the configured model. Falls back to a
 * clearly-labeled placeholder when no model API key is configured, so
 * the workflow stays demonstrable on a fresh clone.
 */
async function generateArtifactBody(input: {
  prompt: string;
  title: string;
}): Promise<string> {
  if (!hasModelApiKey()) {
    return [
      `# ${input.title}`,
      "",
      "_Placeholder content: set OPENAI_API_KEY on the Convex deployment to generate real artifacts._",
      "",
      `Requested prompt:\n\n> ${input.prompt}`,
    ].join("\n");
  }

  const result = await generateText({
    model: resolveChatModel(),
    system:
      "You generate concise, well-structured markdown artifacts. Return only the artifact content, no preamble.",
    prompt: `Create an artifact titled "${input.title}".\n\n${input.prompt}`,
  });

  return result.text;
}

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

    try {
      const artifactBody = await generateArtifactBody({
        prompt: args.prompt,
        title: args.title,
      });

      const artifactId = await ctx.runMutation(
        internal.artifacts.createGeneratedArtifact,
        {
          body: artifactBody,
          kind: "brief",
          profileId: args.profileId,
          projectId: args.projectId,
          title: args.title,
          workflowRunId: args.workflowRunId,
        },
      );

      // Export a markdown copy to file storage. R2 not being configured
      // must not fail the workflow — the artifact already exists in the
      // database.
      try {
        await ctx.runAction(internal.storageNode.putGeneratedFile, {
          fileName: `${args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
          mimeType: "text/markdown",
          profileId: args.profileId,
          purpose: "artifact_export",
          targetId: artifactId,
          targetType: "artifact",
          textContent: artifactBody,
        });
      } catch (exportError) {
        await ctx.runMutation(internal.audit.recordEvent, {
          payload: {
            message:
              exportError instanceof Error
                ? exportError.message
                : String(exportError),
          },
          source: "workflows",
          title: "Artifact export to storage skipped",
        });
      }

      await ctx.runMutation(internal.notifications.enqueueNotification, {
        body: `"${args.title}" is ready to review.`,
        channel: "in_app",
        deepLink: "/(tabs)/projects",
        profileId: args.profileId,
        title: "Artifact ready",
      });

      await ctx.runMutation(internal.workflows.markWorkflowStatus, {
        status: "completed",
        workflowRunId: args.workflowRunId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await ctx.runMutation(internal.workflows.markWorkflowStatus, {
        lastError: message,
        status: "failed",
        workflowRunId: args.workflowRunId,
      });
      await ctx.runMutation(internal.notifications.enqueueNotification, {
        body: `Artifact "${args.title}" failed to generate: ${message}`,
        channel: "in_app",
        profileId: args.profileId,
        title: "Workflow failed",
      });
    }
  },
});

export const listWorkflowRunsForViewer = internalQuery({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) =>
    ctx.db
      .query("workflowRuns")
      .withIndex("by_profile", (query) => query.eq("profileId", args.profileId))
      .collect(),
});

const DIGEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Compile a weekly digest for one profile: active goals, artifacts
 * produced in the window, and approvals waiting on the user.
 */
export const runWeeklyDigestForProfile = internalAction({
  args: {
    profileId: v.id("profiles"),
    workflowRunId: v.id("workflowRuns"),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.workflows.markWorkflowStatus, {
      status: "running",
      workflowRunId: args.workflowRunId,
    });

    try {
      const summary: {
        activeGoals: number;
        pendingApprovals: number;
        recentArtifacts: number;
      } = await ctx.runQuery(internal.workflows.collectDigestCounts, {
        profileId: args.profileId,
        sinceIso: new Date(Date.now() - DIGEST_WINDOW_MS).toISOString(),
      });

      await ctx.runMutation(internal.notifications.enqueueNotification, {
        body: `This week: ${summary.recentArtifacts} new artifact(s), ${summary.activeGoals} active goal(s), ${summary.pendingApprovals} approval(s) waiting on you.`,
        channel: "in_app",
        deepLink: "/(tabs)/notifications",
        profileId: args.profileId,
        title: "Your weekly digest",
      });

      await ctx.runMutation(internal.workflows.markWorkflowStatus, {
        status: "completed",
        workflowRunId: args.workflowRunId,
      });
    } catch (error) {
      await ctx.runMutation(internal.workflows.markWorkflowStatus, {
        lastError: error instanceof Error ? error.message : String(error),
        status: "failed",
        workflowRunId: args.workflowRunId,
      });
    }
  },
});

export const collectDigestCounts = internalQuery({
  args: {
    profileId: v.id("profiles"),
    sinceIso: v.string(),
  },
  handler: async (ctx, args) => {
    const [goals, artifacts, approvals] = await Promise.all([
      ctx.db
        .query("goals")
        .withIndex("by_profile", (query) =>
          query.eq("profileId", args.profileId),
        )
        .collect(),
      ctx.db
        .query("artifacts")
        .withIndex("by_profile", (query) =>
          query.eq("profileId", args.profileId),
        )
        .collect(),
      ctx.db
        .query("approvals")
        .withIndex("by_profile", (query) =>
          query.eq("profileId", args.profileId),
        )
        .collect(),
    ]);

    return {
      activeGoals: goals.filter((goal) => goal.status === "active").length,
      pendingApprovals: approvals.filter(
        (approval) => approval.status === "pending",
      ).length,
      recentArtifacts: artifacts.filter(
        (artifact) => artifact.createdAt >= args.sinceIso,
      ).length,
    };
  },
});

export const listProfileIds = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<Id<"profiles">>> => {
    const profiles = await ctx.db.query("profiles").collect();
    return profiles.map((profile) => profile._id);
  },
});

/**
 * Fan the weekly digest out to every profile. Invoked by the cron in
 * crons.ts; also callable manually from the dashboard.
 */
export const runWeeklyDigestForAllProfiles = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const profileIds: Array<Id<"profiles">> = await ctx.runQuery(
      internal.workflows.listProfileIds,
      {},
    );

    for (const profileId of profileIds) {
      const workflowRunId: Id<"workflowRuns"> = await ctx.runMutation(
        internal.workflows.createWorkflowRecord,
        {
          kind: "weekly_digest",
          profileId,
          trigger: "schedule",
        },
      );
      await ctx.scheduler.runAfter(
        0,
        internal.workflows.runWeeklyDigestForProfile,
        { profileId, workflowRunId },
      );
    }
  },
});

/** Manual digest trigger for the signed-in viewer. */
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
        trigger: "user",
      },
    );

    await ctx.scheduler.runAfter(
      0,
      internal.workflows.runWeeklyDigestForProfile,
      {
        profileId: profile._id,
        workflowRunId,
      },
    );

    return workflowRunId;
  },
});
