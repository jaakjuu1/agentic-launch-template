import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
  query,
} from "./_generated/server";

import { getViewerIdentity } from "./lib/auth";
import {
  isProfileOwnedTarget,
  normalizeEtag,
  resolveStorageTier,
  sumActiveFileBytes,
} from "./lib/storage";
import { nowIso } from "./lib/time";

const filePurposeValidator = v.union(
  v.literal("project_attachment"),
  v.literal("artifact_export"),
  v.literal("assistant_attachment"),
  v.literal("support_attachment"),
  v.literal("generated_output"),
  v.literal("knowledge_base"),
);

const fileOriginValidator = v.union(
  v.literal("user_upload"),
  v.literal("agent_generated"),
  v.literal("operator_upload"),
  v.literal("system_generated"),
);

const fileTargetTypeValidator = v.union(
  v.literal("project"),
  v.literal("artifact"),
  v.literal("agent_message"),
  v.literal("support_request"),
);

const fileAttachmentRoleValidator = v.union(
  v.literal("primary"),
  v.literal("source"),
  v.literal("reference"),
);

const actorRoleValidator = v.union(
  v.literal("consumer"),
  v.literal("operator"),
  v.literal("admin"),
);

async function getProfileByClerkUserId(
  ctx: { db: QueryCtx["db"] | MutationCtx["db"] },
  clerkUserId: string,
) {
  return ctx.db
    .query("profiles")
    .withIndex("by_clerk_user_id", (query) =>
      query.eq("clerkUserId", clerkUserId),
    )
    .unique();
}

async function getTargetProfileId(
  ctx: { db: QueryCtx["db"] | MutationCtx["db"] },
  args: {
    targetId: string;
    targetType: Doc<"fileAttachments">["targetType"];
  },
) {
  switch (args.targetType) {
    case "artifact": {
      const artifact = await ctx.db.get(args.targetId as Id<"artifacts">);
      return (artifact?.profileId as Id<"profiles"> | undefined) ?? null;
    }
    case "project": {
      const project = await ctx.db.get(args.targetId as Id<"projects">);
      return (project?.profileId as Id<"profiles"> | undefined) ?? null;
    }
    case "support_request": {
      const supportRequest = await ctx.db.get(
        args.targetId as Id<"supportRequests">,
      );
      return (supportRequest?.profileId as Id<"profiles"> | undefined) ?? null;
    }
    case "agent_message":
      return null;
  }
}

function serializeFile(
  file: Doc<"files">,
  attachment: Doc<"fileAttachments"> | null,
) {
  return {
    ...file,
    attachment,
    etag: normalizeEtag(file.etag),
  };
}

export const ensureViewerProfileRecord = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    role: actorRoleValidator,
  },
  handler: async (ctx, args): Promise<Id<"profiles">> => {
    const existing = await getProfileByClerkUserId(ctx, args.clerkUserId);
    if (existing) {
      return existing._id;
    }

    const now = nowIso();
    const firstName = args.email.split("@")[0]?.slice(0, 24) || "Launch";
    return ctx.db.insert("profiles", {
      analyticsConsent: true,
      clerkUserId: args.clerkUserId,
      createdAt: now,
      email: args.email,
      firstName,
      locale: "en-US",
      marketingConsent: true,
      role: args.role,
      timezone: "Europe/Helsinki",
      updatedAt: now,
    });
  },
});

export const resolveUploadPolicy = internalQuery({
  args: {
    clerkUserId: v.string(),
    role: actorRoleValidator,
    targetId: v.string(),
    targetType: fileTargetTypeValidator,
  },
  handler: async (ctx, args) => {
    const viewerProfile = await getProfileByClerkUserId(ctx, args.clerkUserId);
    if (viewerProfile === null) {
      throw new Error("Viewer profile is required before initializing uploads");
    }

    const targetProfileId = await getTargetProfileId(ctx, args);
    if (args.targetType !== "agent_message" && targetProfileId === null) {
      throw new Error("Storage target does not exist");
    }

    if (
      args.role === "consumer" &&
      targetProfileId !== null &&
      targetProfileId !== viewerProfile._id
    ) {
      throw new Error("You do not have access to upload against this target");
    }

    const effectiveProfileId = targetProfileId ?? viewerProfile._id;
    const [entitlements, files] = await Promise.all([
      ctx.db
        .query("entitlements")
        .withIndex("by_profile", (query) =>
          query.eq("profileId", effectiveProfileId),
        )
        .collect(),
      ctx.db
        .query("files")
        .withIndex("by_profile", (query) =>
          query.eq("profileId", effectiveProfileId),
        )
        .collect(),
    ]);

    return {
      profileId: effectiveProfileId,
      tier: resolveStorageTier(entitlements),
      totalUsageBytes: sumActiveFileBytes(files),
      viewerProfileId: viewerProfile._id,
    };
  },
});

export const createPendingFileRecord = internalMutation({
  args: {
    attachmentRole: fileAttachmentRoleValidator,
    bucket: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    objectKey: v.string(),
    origin: fileOriginValidator,
    profileId: v.id("profiles"),
    purpose: filePurposeValidator,
    sizeBytes: v.number(),
    targetId: v.string(),
    targetType: fileTargetTypeValidator,
  },
  handler: async (ctx, args): Promise<Id<"files">> => {
    const now = nowIso();
    const fileId = await ctx.db.insert("files", {
      bucket: args.bucket,
      createdAt: now,
      fileName: args.fileName,
      mimeType: args.mimeType,
      objectKey: args.objectKey,
      origin: args.origin,
      profileId: args.profileId,
      purpose: args.purpose,
      sizeBytes: args.sizeBytes,
      status: "pending_upload",
      updatedAt: now,
      uploadStrategy: "single",
      visibility: "private",
    });

    await ctx.db.insert("fileAttachments", {
      createdAt: now,
      fileId,
      profileId: args.profileId,
      role: args.attachmentRole,
      targetId: args.targetId,
      targetType: args.targetType,
    });

    return fileId;
  },
});

export const setFileObjectKey = internalMutation({
  args: {
    fileId: v.id("files"),
    objectKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      objectKey: args.objectKey,
      updatedAt: nowIso(),
    });
  },
});

export const finalizeUploadedFile = internalMutation({
  args: {
    etag: v.optional(v.string()),
    fileId: v.id("files"),
    sizeBytes: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      etag: normalizeEtag(args.etag),
      sizeBytes: args.sizeBytes,
      status: "uploaded",
      updatedAt: nowIso(),
      uploadedAt: nowIso(),
    });
  },
});

export const markFileProcessing = internalMutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      status: "processing",
      updatedAt: nowIso(),
    });
  },
});

export const markFileReady = internalMutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      lastError: undefined,
      readyAt: nowIso(),
      status: "ready",
      updatedAt: nowIso(),
    });
  },
});

export const markFileFailed = internalMutation({
  args: {
    fileId: v.id("files"),
    lastError: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      lastError: args.lastError,
      status: "failed",
      updatedAt: nowIso(),
    });
  },
});

export const replaceFileChunks = internalMutation({
  args: {
    chunks: v.array(
      v.object({
        content: v.string(),
        embedding: v.optional(v.array(v.float64())),
      }),
    ),
    fileId: v.id("files"),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fileChunks")
      .withIndex("by_file", (query) => query.eq("fileId", args.fileId))
      .collect();

    await Promise.all(existing.map((chunk) => ctx.db.delete(chunk._id)));

    const createdAt = nowIso();
    await Promise.all(
      args.chunks.map((chunk, chunkIndex) =>
        ctx.db.insert("fileChunks", {
          chunkIndex,
          content: chunk.content,
          createdAt,
          embedding: chunk.embedding,
          fileId: args.fileId,
          profileId: args.profileId,
        }),
      ),
    );
  },
});

export const markFileDeleted = internalMutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      deletedAt: nowIso(),
      status: "deleted",
      updatedAt: nowIso(),
    });
  },
});

export const listStalePendingUploads = internalQuery({
  args: {
    beforeIso: v.string(),
  },
  handler: async (ctx, args) => {
    const pendingFiles = await ctx.db
      .query("files")
      .withIndex("by_status", (query) => query.eq("status", "pending_upload"))
      .collect();

    return pendingFiles.filter((file) => file.createdAt < args.beforeIso);
  },
});

export const getAuthorizedFileRecord = internalQuery({
  args: {
    clerkUserId: v.string(),
    fileId: v.id("files"),
    role: actorRoleValidator,
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (file === null) {
      return null;
    }

    const attachments = await ctx.db
      .query("fileAttachments")
      .withIndex("by_file", (query) => query.eq("fileId", args.fileId))
      .collect();

    if (args.role !== "consumer") {
      return {
        attachments,
        file,
      };
    }

    const viewerProfile = await getProfileByClerkUserId(ctx, args.clerkUserId);
    if (viewerProfile === null || file.profileId !== viewerProfile._id) {
      throw new Error("You do not have access to this file");
    }

    return {
      attachments,
      file,
    };
  },
});

export const getFileById = internalQuery({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => ctx.db.get(args.fileId),
});

export const resolvePromptAttachments = internalQuery({
  args: {
    attachmentFileIds: v.array(v.id("files")),
    clerkUserId: v.string(),
    role: actorRoleValidator,
  },
  handler: async (ctx, args) => {
    const viewerProfile =
      args.role === "consumer"
        ? await getProfileByClerkUserId(ctx, args.clerkUserId)
        : null;

    const attachments = await Promise.all(
      args.attachmentFileIds.map(async (fileId) => {
        const file = await ctx.db.get(fileId);
        if (file === null) {
          throw new Error("Referenced attachment is missing");
        }

        if (
          args.role === "consumer" &&
          (viewerProfile === null || file.profileId !== viewerProfile._id)
        ) {
          throw new Error(
            "Prompt attachments must belong to the active viewer",
          );
        }

        if (file.status !== "ready") {
          throw new Error("Only ready files can be attached to AI prompts");
        }

        const chunks = await ctx.db
          .query("fileChunks")
          .withIndex("by_file", (query) => query.eq("fileId", fileId))
          .collect();

        return {
          fileId,
          fileName: file.fileName,
          mimeType: file.mimeType,
          snippet: chunks
            .sort((left, right) => left.chunkIndex - right.chunkIndex)
            .map((chunk) => chunk.content)
            .join("\n")
            .slice(0, 1600),
        };
      }),
    );

    return attachments;
  },
});

export const listForTarget = query({
  args: {
    targetId: v.string(),
    targetType: fileTargetTypeValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerIdentity(ctx);
    const viewerProfile = await getProfileByClerkUserId(
      ctx,
      viewer.clerkUserId,
    );
    if (viewerProfile === null) {
      return [];
    }

    const targetProfileId = await getTargetProfileId(ctx, args);
    if (
      viewer.role === "consumer" &&
      args.targetType !== "agent_message" &&
      !isProfileOwnedTarget(viewerProfile._id, {
        profileId: targetProfileId ?? "",
      })
    ) {
      throw new Error("You do not have access to this target");
    }

    const attachments = await ctx.db
      .query("fileAttachments")
      .withIndex("by_target", (query) =>
        query.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .collect();

    const files = await Promise.all(
      attachments.map(async (attachment) => {
        const file = await ctx.db.get(attachment.fileId);
        if (file === null) {
          return null;
        }

        if (
          viewer.role === "consumer" &&
          file.profileId !== viewerProfile._id
        ) {
          return null;
        }

        return serializeFile(file, attachment);
      }),
    );

    return files
      .filter((file): file is NonNullable<typeof file> => file !== null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },
});

export const beginUpload = action({
  args: {
    fileName: v.string(),
    mimeType: v.string(),
    purpose: filePurposeValidator,
    sizeBytes: v.number(),
    targetId: v.string(),
    targetType: fileTargetTypeValidator,
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    expiresAt: string;
    fileId: Id<"files">;
    headers: { "content-type": string };
    method: "PUT";
    objectKey: string;
    uploadUrl: string;
  }> => {
    const viewer = await getViewerIdentity(ctx);
    await ctx.runMutation(internal.storage.ensureViewerProfileRecord, {
      clerkUserId: viewer.clerkUserId,
      email: viewer.email,
      role: viewer.role,
    });

    return ctx.runAction(internal.storageNode.beginUploadNode, {
      ...args,
      viewerClerkUserId: viewer.clerkUserId,
      viewerEmail: viewer.email,
      viewerRole: viewer.role,
    });
  },
});

export const completeUpload = action({
  args: {
    etag: v.optional(v.string()),
    fileId: v.id("files"),
    targetId: v.string(),
    targetType: fileTargetTypeValidator,
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ fileId: Id<"files">; status: "uploaded" }> => {
    const viewer = await getViewerIdentity(ctx);
    return ctx.runAction(internal.storageNode.completeUploadNode, {
      ...args,
      viewerClerkUserId: viewer.clerkUserId,
      viewerRole: viewer.role,
    });
  },
});

export const getDownloadUrl = action({
  args: {
    disposition: v.optional(
      v.union(v.literal("inline"), v.literal("attachment")),
    ),
    fileId: v.id("files"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    disposition: "attachment" | "inline";
    expiresAt: string;
    url: string;
  }> => {
    const viewer = await getViewerIdentity(ctx);
    return ctx.runAction(internal.storageNode.getDownloadUrlNode, {
      ...args,
      viewerClerkUserId: viewer.clerkUserId,
      viewerRole: viewer.role,
    });
  },
});

export const deleteFile = action({
  args: {
    fileId: v.id("files"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ fileId: Id<"files">; status: "deleted" }> => {
    const viewer = await getViewerIdentity(ctx);
    return ctx.runAction(internal.storageNode.deleteFileNode, {
      ...args,
      viewerClerkUserId: viewer.clerkUserId,
      viewerRole: viewer.role,
    });
  },
});
