import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { ErrorText } from "@/components/status-blocks";
import { formatFileSize } from "@/lib/file-helpers";
import type { TrackedUpload } from "@/lib/use-file-upload";

/** In-flight upload row with live status pill and failure reason. */
export function UploadRow({
  onRemove,
  upload,
}: {
  onRemove?: (key: string) => void;
  upload: TrackedUpload;
}) {
  const spinning =
    upload.status === "uploading" || upload.status === "processing";

  return (
    <View className="rounded-[18px] border border-[#16202a]/8 bg-white px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-[#16202a]">
            {upload.fileName}
          </Text>
          <Text className="text-sm leading-6 text-[#5f6772]">
            {formatFileSize(upload.sizeBytes)}
          </Text>
          <ErrorText message={upload.error ?? null} />
        </View>
        <View className="items-end gap-2">
          <View className="flex-row items-center gap-2">
            {spinning ? (
              <ActivityIndicator color="#ff6b35" size="small" />
            ) : null}
            <Text className="rounded-full bg-[#fff3eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[1.4px] text-[#ff6b35]">
              {upload.status}
            </Text>
          </View>
          {upload.status === "failed" && onRemove ? (
            <Pressable hitSlop={8} onPress={() => onRemove(upload.key)}>
              <Text className="text-xs font-semibold text-[#16202a]">
                Remove
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
