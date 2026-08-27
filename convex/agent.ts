import { Agent, createTool, listUIMessages } from "@convex-dev/agent";
import { productConfig } from "@launch/config/product";
import {
  type FunctionReference,
  type FunctionReturnType,
  paginationOptsValidator,
} from "convex/server";
import { v } from "convex/values";
import { z } from "zod";
import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalQuery, mutation, query } from "./_generated/server";

import { resolveChatModel } from "./lib/ai";
import { getViewerIdentity } from "./lib/auth";

/**
 * Minimal structural runQuery type so helpers accept both the app's ctx
 * objects and @convex-dev/agent's ToolCtx (whose bundled convex types may
 * lag the workspace convex version).
 */
type RunQuery = <
  Query extends FunctionReference<"query", "public" | "internal">,
>(
  query: Query,
  args: Query["_args"],
) => Promise<FunctionReturnType<Query>>;

/**
 * Resolve the calling user's profile from inside an agent tool handler.
 * Tool handlers receive the agent component ctx with `userId` set to the
 * Clerk user id passed into createThread/continueThread.
 */
async function resolveToolProfile(ctx: {
  userId?: string | null;
  runQuery: RunQuery;
}): Promise<Doc<"profiles">> {
  if (!ctx.userId) {
    throw new Error("Tools require a user context");
  }

  const profile: Doc<"profiles"> | null = await ctx.runQuery(
    internal.profiles.getByClerkUserId,
    { clerkUserId: ctx.userId },
  );

  if (profile === null) {
    throw new Error("Unable to resolve profile for tool call");
  }

  return profile;
}

const requestArtifactTool = createTool({
  description:
    "Create a generated artifact and durable workflow record for the current project.",
  args: z.object({
    projectId: z
      .string()
      .optional()
      .describe("Optional project id the artifact belongs to"),
    prompt: z.string().describe("What the artifact should contain"),
    title: z.string().describe("Short human-readable artifact title"),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ status: "queued"; workflowRunId: Id<"workflowRuns"> }> => {
    const profile = await resolveToolProfile(ctx);

    // Validate the model-supplied projectId: it must parse and belong to
    // the calling user, otherwise the artifact is created unattached.
    const projectId: Id<"projects"> | null = args.projectId
      ? await ctx.runQuery(internal.projects.resolveOwnedProjectId, {
          candidateId: args.projectId,
          profileId: profile._id,
        })
      : null;

    const workflowRunId: Id<"workflowRuns"> = await ctx.runMutation(
      internal.workflows.createWorkflowRecord,
      {
        kind: "artifact_generation",
        profileId: profile._id,
        projectId: projectId ?? undefined,
        threadId: ctx.threadId,
        trigger: "user",
      },
    );

    await ctx.scheduler.runAfter(0, internal.workflows.runArtifactWorkflow, {
      profileId: profile._id,
      projectId: projectId ?? undefined,
      prompt: args.prompt,
      title: args.title,
      workflowRunId,
    });

    return { status: "queued", workflowRunId };
  },
}) as any;

const riskyApprovalTool = createTool({
  description:
    "Create an approval gate before performing a risky external action. The action must not run until a human approves it.",
  args: z.object({
    description: z.string().describe("What would happen and why it is risky"),
    riskLevel: z.enum(["low", "medium", "high"]).default("high"),
    title: z.string().describe("Short title for the approval request"),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ approvalId: Id<"approvals">; status: "pending" }> => {
    const profile = await resolveToolProfile(ctx);

    const approvalId: Id<"approvals"> = await ctx.runMutation(
      internal.approvals.requestApproval,
      {
        description: args.description,
        profileId: profile._id,
        riskLevel: args.riskLevel,
        title: args.title,
        toolRunId: ctx.messageId ?? "tool_request",
      },
    );

    return { approvalId, status: "pending" };
  },
}) as any;

/**
 * The product's primary agent. Identity, instructions, and default model
 * come from the product config — edit packages/config/src/product.ts (or
 * set AI_MODEL on the deployment) instead of this file when cloning.
 */
const productAgent: Agent<any, any> = new Agent(components.agent, {
  instructions: productConfig.agent.instructions,
  languageModel: resolveChatModel(),
  name: productConfig.agent.name,
  tools: {
    requestArtifactTool,
    riskyApprovalTool,
  },
});

export const resolveProfileByClerkUserId = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("profiles")
      .withIndex("by_clerk_user_id", (query) =>
        query.eq("clerkUserId", args.clerkUserId),
      )
      .unique(),
});

type ThreadMetadata = {
  userId?: string | null;
} | null;

async function assertViewerOwnsThread(
  ctx: {
    runQuery: RunQuery;
  },
  threadId: string,
  clerkUserId: string,
): Promise<void> {
  const thread = (await ctx.runQuery(components.agent.threads.getThread, {
    threadId,
  })) as ThreadMetadata;

  if (thread === null || thread.userId !== clerkUserId) {
    throw new Error("Thread not found for this user");
  }
}

export const createThread = mutation({
  args: {
    summary: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ threadId: string }> => {
    const viewer = await getViewerIdentity(ctx);
    await ctx.runMutation(internal.profiles.ensureProfileForViewer, {});

    return productAgent.createThread(ctx, {
      summary: args.summary,
      title: args.title ?? "New conversation",
      userId: viewer.clerkUserId,
    });
  },
});

export const listThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerIdentity(ctx);
    return ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      order: "desc",
      paginationOpts: args.paginationOpts,
      userId: viewer.clerkUserId,
    });
  },
});

export const listThreadUiMessages = query({
  args: {
    paginationOpts: paginationOptsValidator,
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerIdentity(ctx);
    await assertViewerOwnsThread(ctx, args.threadId, viewer.clerkUserId);
    return listUIMessages(ctx, components.agent, args);
  },
});

export const sendPrompt = action({
  args: {
    attachmentFileIds: v.optional(v.array(v.id("files"))),
    prompt: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, args): Promise<{ text: string; usage: unknown }> => {
    const viewer = await getViewerIdentity(ctx);
    await assertViewerOwnsThread(ctx, args.threadId, viewer.clerkUserId);

    const profile: Doc<"profiles"> | null = await ctx.runQuery(
      internal.profiles.getByClerkUserId,
      { clerkUserId: viewer.clerkUserId },
    );
    if (profile === null) {
      throw new Error("Bootstrap the viewer profile before chatting");
    }

    const attachmentContext =
      args.attachmentFileIds && args.attachmentFileIds.length > 0
        ? await ctx.runQuery(internal.storage.resolvePromptAttachments, {
            attachmentFileIds: args.attachmentFileIds,
            clerkUserId: viewer.clerkUserId,
            role: profile.role,
          })
        : [];

    const { thread } = await productAgent.continueThread(ctx, {
      threadId: args.threadId,
      userId: viewer.clerkUserId,
    });

    const result = await thread.generateText({
      prompt:
        attachmentContext.length === 0
          ? args.prompt
          : `Attached file context:\n${attachmentContext
              .map(
                (attachment: {
                  fileName: string;
                  mimeType: string;
                  snippet: string;
                }) =>
                  `- ${attachment.fileName} (${attachment.mimeType})${
                    attachment.snippet.length > 0
                      ? `\n${attachment.snippet}`
                      : ""
                  }`,
              )
              .join("\n\n")}\n\nUser prompt:\n${args.prompt}`,
    });

    return {
      text: result.text,
      usage: result.usage,
    };
  },
});
