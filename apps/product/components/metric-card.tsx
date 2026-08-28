import { Card, Text } from "@launch/ui-native";

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-w-[110px] flex-1 gap-2 rounded-2xl bg-popover/70 p-4">
      <Text className="text-xs uppercase tracking-[1.6px] text-muted-foreground">
        {label}
      </Text>
      <Text className="text-3xl font-semibold text-foreground">{value}</Text>
    </Card>
  );
}
