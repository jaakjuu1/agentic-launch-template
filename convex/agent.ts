import { openai } from "@ai-sdk/openai";
import { Agent, createTool, listUIMessages } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { z } from "zod";
import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalQuery, mutation, query } from "./_generated/server";

import { getOrCreateViewerProfile, getViewerIdentity } from "./lib/auth";

const requestArtifactTool = createTool({
  description:
    "Create a generated artifact and durable workflow record for the current project.",
  args: z.object({
    projectId: z.string().optional(),
    prompt: z.string(),
    title: z.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ status: "queued"; workflowRunId: Id<"workflowRuns"> }> => {
    if (!ctx.userId) {
      throw new Error("Tools require a user context");
    }

    const profile: Doc<"profiles"> | null = await ctx.runQuery(
      internal.agent.resolveProfileByClerkUserId,
      {
        clerkUserId: ctx.userId,
      },
    );

    if (profile === null) {
      throw new Error("Unable to resolve profile for artifact tool");
    }

    const workflowRunId: Id<"workflowRuns"> = await ctx.runMutation(
      internal.workflows.createWorkflowRecord,
      {
        kind: "artifact_generation",
        profileId: profile._id,
        projectId: args.projectId as any,
        threadId: ctx.threadId,
        trigger: "user",
      },
    );

    await ctx.scheduler.runAfter(0, internal.workflows.runArtifactWorkflow, {
      profileId: profile._id,
      projectId: args.projectId as any,
      prompt: args.prompt,
      title: args.title,
      workflowRunId,
    });

    return { status: "queued", workflowRunId };
  },
}) as any;

const riskyApprovalTool = createTool({
  description:
    "Create an approval gate before performing a risky external action.",
  args: z.object({
    description: z.string(),
    title: z.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ approvalId: Id<"approvals">; status: "pending" }> => {
    if (!ctx.userId) {
      throw new Error("Tools require a user context");
    }

    const profile: Doc<"profiles"> | null = await ctx.runQuery(
      internal.agent.resolveProfileByClerkUserId,
      {
        clerkUserId: ctx.userId,
      },
    );

    if (profile === null) {
      throw new Error("Unable to resolve profile for approval tool");
    }

    const approvalId: Id<"approvals"> = await ctx.runMutation(
      internal.approvals.requestApproval,
      {
        description: args.description,
        profileId: profile._id,
        title: args.title,
        toolRunId: ctx.messageId ?? "tool_request",
      },
    );

    return { approvalId, status: "pending" };
  },
}) as any;

const productivityAgent: Agent<any, any> = new Agent(components.agent, {
  instructions:
    "You are the durable productivity companion for a consumer launch template. Help users turn goals into artifacts, queue background workflows, and route risky actions into approval requests.",
  languageModel: openai.chat("gpt-5-mini"),
  name: "productivity_companion",
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

export const createThread = mutation({
  args: {
    summary: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args): Promise<{ threadId: string }> => {
    const profile = await getOrCreateViewerProfile(ctx);
    if (profile === null) {
      throw new Error("Unable to resolve viewer profile");
    }

    return productivityAgent.createThread(ctx, {
      summary: args.summary,
      title: args.title,
      userId: profile.clerkUserId,
    });
  },
});

export const listThreadUiMessages = query({
  args: {
    paginationOpts: paginationOptsValidator,
    threadId: v.string(),
  },
  handler: async (ctx, args) => listUIMessages(ctx, components.agent, args),
});

export const sendPrompt = action({
  args: {
    attachmentFileIds: v.optional(v.array(v.id("files"))),
    prompt: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, args): Promise<{ text: string; usage: unknown }> => {
    const viewer = await getViewerIdentity(ctx);
    const attachmentContext =
      args.attachmentFileIds && args.attachmentFileIds.length > 0
        ? await ctx.runQuery(internal.storage.resolvePromptAttachments, {
            attachmentFileIds: args.attachmentFileIds,
            clerkUserId: viewer.clerkUserId,
            role: viewer.role,
          })
        : [];
    const { thread } = await productivityAgent.continueThread(ctx, {
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
