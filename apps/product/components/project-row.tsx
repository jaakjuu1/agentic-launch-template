import { StatusPill } from "@launch/ui-native";
import { Text, View } from "react-native";

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
    <View className="gap-3 rounded-[20px] border border-[#16202a]/10 bg-white/80 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-[#16202a]">{name}</Text>
          <Text className="mt-1 text-sm leading-6 text-[#5f6772]">
            {summary}
          </Text>
        </View>
        <StatusPill label={status} tone={tone} />
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-[#e9dfd2]">
        <View
          className="h-full rounded-full bg-[#ff6b35]"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}
