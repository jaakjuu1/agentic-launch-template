import { Pressable, Text, View } from "react-native";

export function FileRow({
  detail,
  label,
  onPress,
  status,
}: {
  detail: string;
  label: string;
  onPress?: () => void;
  status?: string;
}) {
  return (
    <View className="rounded-[18px] border border-[#16202a]/8 bg-white px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-[#16202a]">
            {label}
          </Text>
          <Text className="text-sm leading-6 text-[#5f6772]">{detail}</Text>
        </View>
        {status ? (
          <Text className="rounded-full bg-[#fff3eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[1.4px] text-[#ff6b35]">
            {status}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Pressable onPress={onPress}>
          <Text className="mt-3 text-sm font-semibold text-[#16202a]">
            Open signed link
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
