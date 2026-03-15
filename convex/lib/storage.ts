import { mergeEntitlements } from "@launch/billing";
import { textExtractionMimeTypes } from "@launch/storage";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const staleUploadWindowMs = 20 * 60 * 1000;
export const textChunkSize = 1200;

type DatabaseReader = QueryCtx["db"] | MutationCtx["db"];

export function normalizeEtag(etag: string | undefined) {
  return etag?.replaceAll('"', "");
}

export function resolveStorageTier(
  entitlements: Array<Doc<"entitlements">>,
): "free" | "pro" | "lifetime" {
  return mergeEntitlements(
    entitlements.map((entitlement) => ({
      active: entitlement.active,
      createdAt: entitlement.createdAt,
      id: entitlement._id,
      metadata: entitlement.metadata ?? {},
      originalTransactionId: entitlement.originalTransactionId,
      productKey: entitlement.productKey,
      profileId: entitlement.profileId,
      renewsAt: entitlement.renewsAt,
      source: entitlement.source,
      tier: entitlement.tier,
      updatedAt: entitlement.updatedAt,
    })),
  ).activeTier;
}

export function sumActiveFileBytes(files: Array<Doc<"files">>) {
  return files.reduce((total, file) => {
    if (file.status === "deleted") {
      return total;
    }

    return total + file.sizeBytes;
  }, 0);
}

export function canExtractTextFromMime(mimeType: string) {
  return textExtractionMimeTypes.has(mimeType);
}

export function chunkExtractedText(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  for (let index = 0; index < normalized.length; index += textChunkSize) {
    chunks.push(normalized.slice(index, index + textChunkSize));
  }

  return chunks;
}

export async function loadFilesForTarget(
  db: DatabaseReader,
  targetType: Doc<"fileAttachments">["targetType"],
  targetId: string,
) {
  const attachments = await db
    .query("fileAttachments")
    .withIndex("by_target", (query) =>
      query.eq("targetType", targetType).eq("targetId", targetId),
    )
    .collect();

  const files = await Promise.all(
    attachments.map(async (attachment) => {
      const file = await db.get(attachment.fileId);
      if (file === null) {
        return null;
      }

      return {
        attachment,
        file,
      };
    }),
  );

  return files.filter((entry) => entry !== null);
}

export async function hydrateArtifactsWithFiles(
  db: DatabaseReader,
  artifacts: Array<Doc<"artifacts">>,
) {
  const hydrated = await Promise.all(
    artifacts.map(async (artifact) => ({
      ...artifact,
      files: await loadFilesForTarget(db, "artifact", artifact._id),
    })),
  );

  return hydrated;
}

export function isProfileOwnedTarget(
  profileId: Id<"profiles">,
  target: { profileId: string } | null,
) {
  return target !== null && target.profileId === profileId;
}
