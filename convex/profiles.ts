import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

import {
  deriveFirstName,
  getOrCreateViewerProfile,
  getViewerProfile,
  parseRoleClaim,
} from "./lib/auth";
import { nowIso } from "./lib/time";

/** Public: the signed-in viewer's profile, or null before bootstrap. */
export const viewerProfile = query({
  args: {},
  handler: async (ctx) => getViewerProfile(ctx),
});

export const updateConsents = mutation({
  args: {
    analyticsConsent: v.optional(v.boolean()),
    marketingConsent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateViewerProfile(ctx);
    await ctx.db.patch(profile._id, {
      ...(args.analyticsConsent === undefined
        ? {}
        : { analyticsConsent: args.analyticsConsent }),
      ...(args.marketingConsent === undefined
        ? {}
        : { marketingConsent: args.marketingConsent }),
      updatedAt: nowIso(),
    });
    return ctx.db.get(profile._id);
  },
});

/** Internal: resolve a profile from a Clerk user id (used by actions). */
export const getByClerkUserId = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("profiles")
      .withIndex("by_clerk_user_id", (query) =>
        query.eq("clerkUserId", args.clerkUserId),
      )
      .unique(),
});

/**
 * Internal: create (or return) the profile for the authenticated caller.
 * Auth context propagates into runMutation, so actions can call this
 * without forwarding identity fields.
 */
export const ensureProfileForViewer = internalMutation({
  args: {},
  handler: async (ctx): Promise<Doc<"profiles">> =>
    getOrCreateViewerProfile(ctx),
});

/**
 * Internal: sync a profile from a verified Clerk webhook
 * (user.created / user.updated). The `app:role` public-metadata field is
 * the only way a profile gains operator/admin rights.
 */
export const upsertFromClerk = internalMutation({
  args: {
    avatarUrl: v.optional(v.string()),
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    roleClaim: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"profiles">> => {
    const now = nowIso();
    const role = parseRoleClaim(args.roleClaim);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_user_id", (query) =>
        query.eq("clerkUserId", args.clerkUserId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        avatarUrl: args.avatarUrl,
        email: args.email,
        firstName: deriveFirstName({
          email: args.email,
          firstName: args.firstName,
        }),
        lastName: args.lastName,
        role,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("profiles", {
      analyticsConsent: false,
      avatarUrl: args.avatarUrl,
      clerkUserId: args.clerkUserId,
      createdAt: now,
      email: args.email,
      firstName: deriveFirstName({
        email: args.email,
        firstName: args.firstName,
      }),
      lastName: args.lastName,
      locale: "en-US",
      marketingConsent: false,
      role,
      timezone: "UTC",
      updatedAt: now,
    });
  },
});

/**
 * Internal: hard-delete a user and everything they own (Clerk
 * user.deleted webhook → account deletion). Removes owned rows, agent
 * threads/messages, and schedules R2 object deletion for stored files.
 *
 * Uses collect() per table, which is fine for individual-consumer data
 * volumes; shard by cursor if a profile can own thousands of rows.
 */
export const deleteProfileCascade = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_user_id", (query) =>
        query.eq("clerkUserId", args.clerkUserId),
      )
      .unique();

    if (profile === null) {
      return { deleted: false };
    }

    const byProfile = (table: "goals" | "projects" | "artifacts") =>
      ctx.db
        .query(table)
        .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
        .collect();

    const [goals, projects, artifacts] = await Promise.all([
      byProfile("goals"),
      byProfile("projects"),
      byProfile("artifacts"),
    ]);
    const [approvals, entitlements, notifications] = await Promise.all([
      ctx.db
        .query("approvals")
        .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
        .collect(),
      ctx.db
        .query("entitlements")
        .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
        .collect(),
      ctx.db
        .query("notifications")
        .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
        .collect(),
    ]);
    const [supportRequests, workflowRuns, files, fileChunks] =
      await Promise.all([
        ctx.db
          .query("supportRequests")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
        ctx.db
          .query("workflowRuns")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
        ctx.db
          .query("files")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
        ctx.db
          .query("fileChunks")
          .withIndex("by_profile", (query) =>
            query.eq("profileId", profile._id),
          )
          .collect(),
      ]);

    const attachments = await ctx.db
      .query("fileAttachments")
      .withIndex("by_profile_target", (query) =>
        query.eq("profileId", profile._id),
      )
      .collect();

    await Promise.all(
      [
        ...goals,
        ...projects,
        ...artifacts,
        ...approvals,
        ...entitlements,
        ...notifications,
        ...supportRequests,
        ...workflowRuns,
        ...fileChunks,
        ...attachments,
        ...files,
      ].map((row) => ctx.db.delete(row._id)),
    );

    // Remove agent threads + messages owned by this Clerk user.
    await ctx.runMutation(components.agent.users.deleteAllForUserIdAsync, {
      userId: args.clerkUserId,
    });

    // Remove stored objects from R2 outside the transaction.
    const objectKeys = files
      .filter((file) => file.objectKey !== "pending")
      .map((file) => ({ bucket: file.bucket, objectKey: file.objectKey }));
    if (objectKeys.length > 0) {
      await ctx.scheduler.runAfter(0, internal.storageNode.hardDeleteObjects, {
        objects: objectKeys,
      });
    }

    await ctx.db.delete(profile._id);
    return { deleted: true };
  },
});
