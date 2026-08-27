import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { requireOperatorProfile } from "./lib/auth";
import { nowIso } from "./lib/time";

/**
 * Operator console overview. Gated on the operator/admin role (set via
 * the Clerk `app:role` public-metadata claim). Uses collect() on
 * bounded tables — swap to paginated queries if these grow large.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireOperatorProfile(ctx);

    const [profiles, files, supportRequests, approvals, workflowRuns] =
      await Promise.all([
        ctx.db.query("profiles").collect(),
        ctx.db.query("files").order("desc").take(25),
        ctx.db.query("supportRequests").order("desc").take(50),
        ctx.db.query("approvals").order("desc").take(50),
        ctx.db.query("workflowRuns").order("desc").take(50),
      ]);

    return {
      counts: {
        failedWorkflows: workflowRuns.filter((run) => run.status === "failed")
          .length,
        openSupportRequests: supportRequests.filter(
          (request) => request.status === "open",
        ).length,
        pendingApprovals: approvals.filter(
          (approval) => approval.status === "pending",
        ).length,
        profiles: profiles.length,
      },
      recentFiles: files.map((file) => ({
        _id: file._id,
        createdAt: file.createdAt,
        fileName: file.fileName,
        mimeType: file.mimeType,
        purpose: file.purpose,
        sizeBytes: file.sizeBytes,
        status: file.status,
      })),
      recentWorkflows: workflowRuns.map((run) => ({
        _id: run._id,
        createdAt: run.createdAt,
        kind: run.kind,
        lastError: run.lastError,
        status: run.status,
      })),
      supportQueue: supportRequests.map((request) => ({
        _id: request._id,
        createdAt: request.createdAt,
        status: request.status,
        subject: request.subject,
      })),
    };
  },
});

export const updateSupportRequestStatus = mutation({
  args: {
    status: v.union(
      v.literal("open"),
      v.literal("triaged"),
      v.literal("resolved"),
    ),
    supportRequestId: v.id("supportRequests"),
  },
  handler: async (ctx, args) => {
    await requireOperatorProfile(ctx);
    await ctx.db.patch(args.supportRequestId, {
      status: args.status,
      updatedAt: nowIso(),
    });
    return ctx.db.get(args.supportRequestId);
  },
});
