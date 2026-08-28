import { Badge, Card, Text } from "@launch/ui-native";
import { Pressable, View } from "react-native";

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
    <Card className="gap-0 rounded-2xl bg-popover px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground">
            {label}
          </Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            {detail}
          </Text>
        </View>
        {status ? (
          <Badge className="rounded-full border-0 bg-primary/10 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-primary">
              {status}
            </Text>
          </Badge>
        ) : null}
      </View>
      {onPress ? (
        <Pressable onPress={onPress}>
          <Text className="mt-3 text-sm font-semibold text-foreground">
            Open signed link
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
