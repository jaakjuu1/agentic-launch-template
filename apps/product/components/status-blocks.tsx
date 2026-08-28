import { colors } from "@launch/design-tokens";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
  Text,
} from "@launch/ui-native";
import { ActivityIndicator, View } from "react-native";

/** Full-card loading state used while a screen's first query resolves. */
export function LoadingCard({ title }: { title: string }) {
  return (
    <Card className="gap-3 rounded-3xl py-5">
      <CardHeader className="gap-3 px-5">
        <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
          Loading
        </Text>
        <CardTitle className="text-[28px] leading-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="gap-3 px-5">
        <View className="flex-row items-center gap-3 py-2">
          <ActivityIndicator color={colors.accent} />
          <Text className="text-base text-muted-foreground">
            Fetching live data…
          </Text>
        </View>
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
      </CardContent>
    </Card>
  );
}

/** Inline error line for failed async handlers. */
export function ErrorText({ message }: { message: string | null }) {
  if (message === null || message.length === 0) {
    return null;
  }

  return <Text className="text-sm leading-6 text-destructive">{message}</Text>;
}

/** Inline empty-state line for lists without content yet. */
export function EmptyText({ message }: { message: string }) {
  return (
    <Text className="text-sm italic leading-6 text-muted-foreground">
      {message}
    </Text>
  );
}

export type StatusTone = "neutral" | "success" | "warning";

const toneBadgeClass: Record<StatusTone, string> = {
  neutral: "bg-muted",
  success: "bg-success/15",
  warning: "bg-warning/15",
};

const toneTextClass: Record<StatusTone, string> = {
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
};

/** Soft tonal status chip built on the kit Badge. */
export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <Badge
      className={cn(
        "self-start rounded-full border-0 px-3 py-1.5",
        toneBadgeClass[tone],
      )}
    >
      <Text className={cn("text-xs font-semibold", toneTextClass[tone])}>
        {label}
      </Text>
    </Badge>
  );
}
