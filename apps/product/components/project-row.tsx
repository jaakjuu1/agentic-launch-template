import { Card, Progress, Text } from "@launch/ui-native";
import { View } from "react-native";

import { StatusBadge } from "@/components/status-blocks";

export function ProjectRow({
  name,
  progress,
  status,
  summary,
}: {
  name: string;
  progress: number;
  status: string;
  summary: string;
}) {
  const tone =
    status === "Needs approval"
      ? "warning"
      : status === "Ready to QA"
        ? "success"
        : "neutral";

  return (
    <Card className="gap-3 rounded-2xl bg-popover/80 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{name}</Text>
          <Text className="mt-1 text-sm leading-6 text-muted-foreground">
            {summary}
          </Text>
        </View>
        <StatusBadge label={status} tone={tone} />
      </View>
      <Progress
        className="bg-muted"
        indicatorClassName="bg-primary"
        value={progress}
      />
    </Card>
  );
}
