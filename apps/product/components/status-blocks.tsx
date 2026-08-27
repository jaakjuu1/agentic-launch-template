import { SectionCard } from "@launch/ui-native";
import { ActivityIndicator, Text, View } from "react-native";

/** Full-card loading state used while a screen's first query resolves. */
export function LoadingCard({ title }: { title: string }) {
  return (
    <SectionCard eyebrow="Loading" title={title}>
      <View className="flex-row items-center gap-3 py-2">
        <ActivityIndicator color="#ff6b35" />
        <Text className="text-base text-[#5f6772]">Fetching live data…</Text>
      </View>
    </SectionCard>
  );
}

/** Inline error line for failed async handlers. */
export function ErrorText({ message }: { message: string | null }) {
  if (message === null || message.length === 0) {
    return null;
  }

  return <Text className="text-sm leading-6 text-[#b3261e]">{message}</Text>;
}

/** Inline empty-state line for lists without content yet. */
export function EmptyText({ message }: { message: string }) {
  return (
    <Text className="text-sm italic leading-6 text-[#7b838e]">{message}</Text>
  );
}
