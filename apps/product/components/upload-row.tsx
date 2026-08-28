import { colors } from "@launch/design-tokens";
import { Badge, Card, Text } from "@launch/ui-native";
import { ActivityIndicator, Pressable, View } from "react-native";

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
    <Card className="gap-0 rounded-2xl bg-popover px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground">
            {upload.fileName}
          </Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            {formatFileSize(upload.sizeBytes)}
          </Text>
          <ErrorText message={upload.error ?? null} />
        </View>
        <View className="items-end gap-2">
          <View className="flex-row items-center gap-2">
            {spinning ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : null}
            <Badge className="rounded-full border-0 bg-primary/10 px-3 py-1">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-primary">
                {upload.status}
              </Text>
            </Badge>
          </View>
          {upload.status === "failed" && onRemove ? (
            <Pressable hitSlop={8} onPress={() => onRemove(upload.key)}>
              <Text className="text-xs font-semibold text-foreground">
                Remove
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
