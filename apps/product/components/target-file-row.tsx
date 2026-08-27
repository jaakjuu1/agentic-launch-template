import { api } from "@launch/convex/_generated/api";
import type { Id } from "@launch/convex/_generated/dataModel";
import { useAction } from "convex/react";
import * as Linking from "expo-linking";
import { useState } from "react";
import { View } from "react-native";

import { FileRow } from "@/components/file-row";
import { ErrorText } from "@/components/status-blocks";
import { getErrorMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/file-helpers";

export type TargetFile = {
  _id: Id<"files">;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
};

/** Statuses whose bytes exist in storage and can be downloaded. */
const openableStatuses = new Set(["uploaded", "processing", "ready"]);

/**
 * Stored file row backed by `api.storage.listForTarget` results, with an
 * "Open" action that resolves a signed download URL on demand.
 */
export function TargetFileRow({ file }: { file: TargetFile }) {
  const getDownloadUrl = useAction(api.storage.getDownloadUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await getDownloadUrl({ fileId: file._id });
      await Linking.openURL(result.url);
    } catch (openError) {
      setError(getErrorMessage(openError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-1">
      <FileRow
        detail={`${file.mimeType} · ${formatFileSize(file.sizeBytes)}`}
        label={file.fileName}
        onPress={
          openableStatuses.has(file.status) ? () => void open() : undefined
        }
        status={busy ? "opening…" : file.status}
      />
      <ErrorText message={error} />
    </View>
  );
}
