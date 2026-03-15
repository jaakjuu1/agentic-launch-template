import { Text, View } from "react-native";

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[110px] flex-1 rounded-[20px] border border-[#16202a]/10 bg-white/70 p-4">
      <Text className="text-xs uppercase tracking-[1.6px] text-[#5f6772]">
        {label}
      </Text>
      <Text className="mt-2 text-3xl font-semibold text-[#16202a]">
        {value}
      </Text>
    </View>
  );
}
