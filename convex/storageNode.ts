"use node";

import { openai } from "@ai-sdk/openai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { parseConvexEnv } from "@launch/config";
import {
  assertUploadAllowed,
  buildObjectKey,
  createR2Client,
  createSignedDownloadUrl,
  createSignedUploadUrl,
  deletePrivateObject,
  headPrivateObject,
  putPrivateObject,
} from "@launch/storage";
import { embedMany } from "ai";
import { v } from "convex/values";
import pdfParse from "pdf-parse";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

import {
  canExtractTextFromMime,
  chunkExtractedText,
  staleUploadWindowMs,
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

const fileTargetTypeValidator = v.union(
  v.literal("project"),
  v.literal("artifact"),
  v.literal("agent_message"),
  v.literal("support_request"),
);

const actorRoleValidator = v.union(
  v.literal("consumer"),
  v.literal("operator"),
  v.literal("admin"),
);

function getRequiredR2Config() {
  const env = parseConvexEnv(process.env);
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_PRIVATE_BUCKET
  ) {
    throw new Error(
      "R2 storage is not configured. Set the R2_* variables in convex/.env.local.",
    );
  }

  return {
    bucket: env.R2_PRIVATE_BUCKET,
    client: createR2Client({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      accountId: env.R2_ACCOUNT_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    }),
    downloadTtlSeconds: env.R2_DOWNLOAD_URL_TTL_SECONDS ?? 300,
    maxUploadBytes: env.R2_MAX_UPLOAD_BYTES ?? 100 * 1024 * 1024,
    uploadTtlSeconds: env.R2_UPLOAD_URL_TTL_SECONDS ?? 600,
  };
}

async function toBuffer(body: unknown) {
  if (body === undefined || body === null) {
    return Buffer.alloc(0);
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "transformToByteArray" in body &&
    typeof body.transformToByteArray === "function"
  ) {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<
    Buffer | Uint8Array | string
  >) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(typeof chunk === "string" ? chunk : chunk),
    );
  }

  return Buffer.concat(chunks);
}

async function loadObjectBuffer(input: {
  bucket: string;
  client: ReturnType<typeof createR2Client>;
  key: string;
}) {
  const response = await input.client.send(
    new GetObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
    }),
  );

  return toBuffer(response.Body);
}

async function extractTextContent(file: Doc<"files">, buffer: Buffer) {
  if (!canExtractTextFromMime(file.mimeType)) {
    return "";
  }

  if (file.mimeType === "application/pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  return buffer.toString("utf8");
}

async function buildEmbeddings(chunks: string[]) {
  if (chunks.length === 0 || !process.env.OPENAI_API_KEY) {
    return chunks.map(() => undefined);
  }

  const result = await embedMany({
    model: openai.textEmbeddingModel("text-embedding-3-small"),
    values: chunks,
  });

  return result.embeddings;
}

async function recordStorageEvent(
  ctx: any,
  input: {
    actorId?: string;
    payload?: Record<string, unknown>;
    title: string;
  },
) {
  await ctx.runMutation(internal.audit.recordEvent, {
    actorId: input.actorId,
    payload: input.payload,
    source: "storage",
    title: input.title,
  });
}

export const beginUploadNode = internalAction({
  args: {
    fileName: v.string(),
    mimeType: v.string(),
    purpose: filePurposeValidator,
    sizeBytes: v.number(),
    targetId: v.string(),
    targetType: fileTargetTypeValidator,
    viewerClerkUserId: v.string(),
    viewerEmail: v.string(),
    viewerRole: actorRoleValidator,
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
    const config = getRequiredR2Config();

    const policy: {
      profileId: Id<"profiles">;
      tier: "free" | "pro" | "lifetime";
      totalUsageBytes: number;
      viewerProfileId: Id<"profiles">;
    } = await ctx.runQuery(internal.storage.resolveUploadPolicy, {
      clerkUserId: args.viewerClerkUserId,
      role: args.viewerRole,
      targetId: args.targetId,
      targetType: args.targetType,
    });

    assertUploadAllowed({
      fileName: args.fileName,
      maxUploadBytes: config.maxUploadBytes,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      tier: policy.tier,
      totalUsageBytes: policy.totalUsageBytes,
    });

    const fileId: Id<"files"> = await ctx.runMutation(
      internal.storage.createPendingFileRecord,
      {
        attachmentRole:
          args.targetType === "artifact" ? "primary" : "reference",
        bucket: config.bucket,
        fileName: args.fileName,
        mimeType: args.mimeType,
        objectKey: "pending",
        origin:
          args.viewerRole === "consumer" ? "user_upload" : "operator_upload",
        profileId: policy.profileId,
        purpose: args.purpose,
        sizeBytes: args.sizeBytes,
        targetId: args.targetId,
        targetType: args.targetType,
      },
    );

    const objectKey = buildObjectKey({
      createdAt: new Date(),
      fileId,
      fileName: args.fileName,
      profileId: policy.profileId,
      purpose: args.purpose,
    });

    await ctx.runMutation(internal.storage.setFileObjectKey, {
      fileId,
      objectKey,
    });

    const uploadUrl = await createSignedUploadUrl({
      bucket: config.bucket,
      client: config.client,
      contentDisposition: `attachment; filename="${args.fileName}"`,
      expiresIn: config.uploadTtlSeconds,
      key: objectKey,
      mimeType: args.mimeType,
    });

    await ctx.scheduler.runAfter(
      (config.uploadTtlSeconds + 300) * 1000,
      internal.storageNode.cleanupStaleUploads,
      {},
    );

    await recordStorageEvent(ctx, {
      actorId: args.viewerClerkUserId,
      payload: {
        fileId,
        fileName: args.fileName,
        mimeType: args.mimeType,
        targetId: args.targetId,
        targetType: args.targetType,
      },
      title: "file_upload_started",
    });

    return {
      expiresAt: new Date(
        Date.now() + config.uploadTtlSeconds * 1000,
      ).toISOString(),
      fileId,
      headers: {
        "content-type": args.mimeType,
      },
      method: "PUT" as const,
      objectKey,
      uploadUrl,
    };
  },
});

export const completeUploadNode = internalAction({
  args: {
    etag: v.optional(v.string()),
    fileId: v.id("files"),
    targetId: v.string(),
    targetType: fileTargetTypeValidator,
    viewerClerkUserId: v.string(),
    viewerRole: actorRoleValidator,
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ fileId: Id<"files">; status: "uploaded" }> => {
    const config = getRequiredR2Config();
    const record = await ctx.runQuery(
      internal.storage.getAuthorizedFileRecord,
      {
        clerkUserId: args.viewerClerkUserId,
        fileId: args.fileId,
        role: args.viewerRole,
      },
    );

    if (record === null) {
      throw new Error("Unable to resolve the uploaded file");
    }

    const attachedToTarget = record.attachments.some(
      (attachment: { targetId: string; targetType: string }) =>
        attachment.targetId === args.targetId &&
        attachment.targetType === args.targetType,
    );

    if (!attachedToTarget) {
      throw new Error(
        "Upload target does not match the stored attachment link",
      );
    }

    const head = await headPrivateObject({
      bucket: config.bucket,
      client: config.client,
      key: record.file.objectKey,
    });

    await ctx.runMutation(internal.storage.finalizeUploadedFile, {
      etag: args.etag ?? head.ETag,
      fileId: args.fileId,
      sizeBytes: head.ContentLength ?? record.file.sizeBytes,
    });

    await ctx.scheduler.runAfter(0, internal.storageNode.processReadyFile, {
      fileId: args.fileId,
    });

    await recordStorageEvent(ctx, {
      actorId: args.viewerClerkUserId,
      payload: {
        fileId: args.fileId,
        targetId: args.targetId,
        targetType: args.targetType,
      },
      title: "file_upload_completed",
    });

    return {
      fileId: args.fileId,
      status: "uploaded" as const,
    };
  },
});

export const getDownloadUrlNode = internalAction({
  args: {
    disposition: v.optional(
      v.union(v.literal("inline"), v.literal("attachment")),
    ),
    fileId: v.id("files"),
    viewerClerkUserId: v.string(),
    viewerRole: actorRoleValidator,
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    disposition: "attachment" | "inline";
    expiresAt: string;
    url: string;
  }> => {
    const config = getRequiredR2Config();
    const record = await ctx.runQuery(
      internal.storage.getAuthorizedFileRecord,
      {
        clerkUserId: args.viewerClerkUserId,
        fileId: args.fileId,
        role: args.viewerRole,
      },
    );

    if (record === null) {
      throw new Error("Unable to resolve the requested file");
    }

    const disposition = args.disposition ?? "attachment";
    const url = await createSignedDownloadUrl({
      bucket: config.bucket,
      client: config.client,
      disposition,
      expiresIn: config.downloadTtlSeconds,
      fileName: record.file.fileName,
      key: record.file.objectKey,
    });

    await recordStorageEvent(ctx, {
      actorId: args.viewerClerkUserId,
      payload: {
        disposition,
        fileId: args.fileId,
      },
      title: "file_download_requested",
    });

    return {
      disposition,
      expiresAt: new Date(
        Date.now() + config.downloadTtlSeconds * 1000,
      ).toISOString(),
      url,
    };
  },
});

export const deleteFileNode = internalAction({
  args: {
    fileId: v.id("files"),
    viewerClerkUserId: v.string(),
    viewerRole: actorRoleValidator,
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ fileId: Id<"files">; status: "deleted" }> => {
    const config = getRequiredR2Config();
    const record = await ctx.runQuery(
      internal.storage.getAuthorizedFileRecord,
      {
        clerkUserId: args.viewerClerkUserId,
        fileId: args.fileId,
        role: args.viewerRole,
      },
    );

    if (record === null) {
      throw new Error("Unable to resolve the requested file");
    }

    await deletePrivateObject({
      bucket: config.bucket,
      client: config.client,
      key: record.file.objectKey,
    }).catch(() => undefined);

    await ctx.runMutation(internal.storage.markFileDeleted, {
      fileId: args.fileId,
    });

    await recordStorageEvent(ctx, {
      actorId: args.viewerClerkUserId,
      payload: {
        fileId: args.fileId,
      },
      title: "file_deleted",
    });

    return {
      fileId: args.fileId,
      status: "deleted" as const,
    };
  },
});

export const putGeneratedFile = internalAction({
  args: {
    attachmentRole: v.optional(
      v.union(
        v.literal("primary"),
        v.literal("source"),
        v.literal("reference"),
      ),
    ),
    contentBase64: v.optional(v.string()),
    fileName: v.string(),
    mimeType: v.string(),
    profileId: v.id("profiles"),
    purpose: filePurposeValidator,
    targetId: v.string(),
    targetType: fileTargetTypeValidator,
    textContent: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ fileId: Id<"files">; objectKey: string }> => {
    const config = getRequiredR2Config();
    const body =
      args.textContent !== undefined
        ? Buffer.from(args.textContent, "utf8")
        : args.contentBase64
          ? Buffer.from(args.contentBase64, "base64")
          : null;

    if (body === null) {
      throw new Error(
        "Generated file uploads require textContent or contentBase64",
      );
    }

    const fileId: Id<"files"> = await ctx.runMutation(
      internal.storage.createPendingFileRecord,
      {
        attachmentRole: args.attachmentRole ?? "primary",
        bucket: config.bucket,
        fileName: args.fileName,
        mimeType: args.mimeType,
        objectKey: "pending",
        origin: "agent_generated",
        profileId: args.profileId,
        purpose: args.purpose,
        sizeBytes: body.byteLength,
        targetId: args.targetId,
        targetType: args.targetType,
      },
    );

    const objectKey = buildObjectKey({
      createdAt: new Date(),
      fileId,
      fileName: args.fileName,
      profileId: args.profileId,
      purpose: args.purpose,
    });

    await ctx.runMutation(internal.storage.setFileObjectKey, {
      fileId,
      objectKey,
    });

    await putPrivateObject({
      body,
      bucket: config.bucket,
      client: config.client,
      contentDisposition: `attachment; filename="${args.fileName}"`,
      key: objectKey,
      metadata: {
        generatedAt: nowIso(),
      },
      mimeType: args.mimeType,
    });

    await ctx.runMutation(internal.storage.finalizeUploadedFile, {
      fileId,
      sizeBytes: body.byteLength,
    });

    await ctx.runAction(internal.storageNode.processReadyFile, {
      fileId,
    });

    return {
      fileId,
      objectKey,
    };
  },
});

export const processReadyFile = internalAction({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args): Promise<void> => {
    const config = getRequiredR2Config();
    const file = await ctx.runQuery(internal.storage.getFileById, {
      fileId: args.fileId,
    });

    if (file === null || file.status === "deleted") {
      return;
    }

    await ctx.runMutation(internal.storage.markFileProcessing, {
      fileId: args.fileId,
    });

    try {
      const buffer = await loadObjectBuffer({
        bucket: config.bucket,
        client: config.client,
        key: file.objectKey,
      });
      const content = await extractTextContent(file, buffer);
      const chunks = chunkExtractedText(content);

      if (chunks.length > 0) {
        const embeddings = await buildEmbeddings(chunks);
        await ctx.runMutation(internal.storage.replaceFileChunks, {
          chunks: chunks.map((chunk, index) => ({
            content: chunk,
            embedding: embeddings[index],
          })),
          fileId: args.fileId,
          profileId: file.profileId,
        });
      } else {
        await ctx.runMutation(internal.storage.replaceFileChunks, {
          chunks: [],
          fileId: args.fileId,
          profileId: file.profileId,
        });
      }

      await ctx.runMutation(internal.storage.markFileReady, {
        fileId: args.fileId,
      });
    } catch (error) {
      await ctx.runMutation(internal.storage.markFileFailed, {
        fileId: args.fileId,
        lastError:
          error instanceof Error
            ? error.message
            : "Unknown file processing failure",
      });
    }
  },
});

export const cleanupStaleUploads = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const config = getRequiredR2Config();
    const beforeIso = new Date(Date.now() - staleUploadWindowMs).toISOString();
    const staleFiles = await ctx.runQuery(
      internal.storage.listStalePendingUploads,
      {
        beforeIso,
      },
    );

    await Promise.all(
      staleFiles.map(async (file: (typeof staleFiles)[number]) => {
        await deletePrivateObject({
          bucket: config.bucket,
          client: config.client,
          key: file.objectKey,
        }).catch(() => undefined);

        await ctx.runMutation(internal.storage.markFileFailed, {
          fileId: file._id,
          lastError: "Upload window expired before completion",
        });
      }),
    );
  },
});
