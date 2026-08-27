import { api } from "@launch/convex/_generated/api";
import type { Id } from "@launch/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useCallback, useRef, useState } from "react";

import { getErrorMessage } from "@/lib/errors";
import type { PickedLaunchFile } from "@/lib/file-picker";

export type UploadStatus = "uploading" | "processing" | "ready" | "failed";

export type UploadPurpose =
  | "project_attachment"
  | "assistant_attachment"
  | "support_attachment";

export type UploadTargetType = "project" | "agent_message" | "support_request";

export type UploadTarget = {
  purpose: UploadPurpose;
  /** Project id, thread id (for assistant), or support request id. */
  targetId: string;
  targetType: UploadTargetType;
};

export type TrackedUpload = {
  error?: string;
  /** Convex file id, available once beginUpload succeeds. */
  fileId: Id<"files"> | null;
  fileName: string;
  key: string;
  sizeBytes: number;
  status: UploadStatus;
};

async function resolveFileBody(file: PickedLaunchFile): Promise<Blob> {
  if (file.webFile) {
    return file.webFile;
  }

  if (file.uri) {
    // Native picker URIs (file:// or content://) are readable via fetch
    // in Expo; the resulting blob is what the signed PUT expects.
    const response = await fetch(file.uri);
    return response.blob();
  }

  throw new Error("Picked file has no readable content");
}

/**
 * Encapsulates the storage upload lifecycle:
 * beginUpload (signed PUT ticket) → HTTP PUT of the bytes → completeUpload.
 *
 * Each call is tracked with a per-file status
 * ("uploading" | "processing" | "ready" | "failed") plus the failure
 * reason, so screens can render progress rows without re-implementing
 * the flow. Note the backend keeps extracting text after "ready" — the
 * authoritative server-side status is available via
 * `api.storage.listForTarget`.
 */
export function useFileUpload() {
  const beginUpload = useAction(api.storage.beginUpload);
  const completeUpload = useAction(api.storage.completeUpload);
  const [uploads, setUploads] = useState<TrackedUpload[]>([]);
  const counterRef = useRef(0);

  const patchUpload = useCallback(
    (key: string, patch: Partial<TrackedUpload>) => {
      setUploads((current) =>
        current.map((upload) =>
          upload.key === key ? { ...upload, ...patch } : upload,
        ),
      );
    },
    [],
  );

  const uploadFile = useCallback(
    async (
      file: PickedLaunchFile,
      target: UploadTarget,
    ): Promise<Id<"files"> | null> => {
      counterRef.current += 1;
      const key = `upload_${counterRef.current}_${Date.now()}`;

      setUploads((current) => [
        ...current,
        {
          fileId: null,
          fileName: file.fileName,
          key,
          sizeBytes: file.sizeBytes,
          status: "uploading",
        },
      ]);

      try {
        const body = await resolveFileBody(file);
        const sizeBytes = body.size > 0 ? body.size : file.sizeBytes;
        patchUpload(key, { sizeBytes });

        const ticket = await beginUpload({
          fileName: file.fileName,
          mimeType: file.mimeType,
          purpose: target.purpose,
          sizeBytes,
          targetId: target.targetId,
          targetType: target.targetType,
        });
        patchUpload(key, { fileId: ticket.fileId });

        const putResponse = await fetch(ticket.uploadUrl, {
          body,
          headers: ticket.headers,
          method: ticket.method,
        });
        if (!putResponse.ok) {
          throw new Error(`Storage upload failed (HTTP ${putResponse.status})`);
        }

        patchUpload(key, { status: "processing" });
        await completeUpload({
          etag: putResponse.headers.get("etag") ?? undefined,
          fileId: ticket.fileId,
          targetId: target.targetId,
          targetType: target.targetType,
        });

        patchUpload(key, { status: "ready" });
        return ticket.fileId;
      } catch (error) {
        patchUpload(key, { error: getErrorMessage(error), status: "failed" });
        return null;
      }
    },
    [beginUpload, completeUpload, patchUpload],
  );

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const removeUpload = useCallback((key: string) => {
    setUploads((current) => current.filter((upload) => upload.key !== key));
  }, []);

  return { clearUploads, removeUpload, uploadFile, uploads };
}
