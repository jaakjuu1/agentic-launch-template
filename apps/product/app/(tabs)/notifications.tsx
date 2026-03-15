import { AppScreen, SectionCard, StatusPill } from "@launch/ui-native";
import { Text, View } from "react-native";

import { referenceNotifications } from "@/lib/reference-data";

export default function NotificationsScreen() {
  return (
    <AppScreen>
      <SectionCard
        eyebrow="Inbox"
        title="Push, email, and in-app state stay aligned"
      >
        <View className="gap-3">
          {referenceNotifications.map((notification) => (
            <View
              key={notification.id}
              className="rounded-[20px] border border-[#16202a]/10 bg-white/80 p-4"
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-lg font-semibold text-[#16202a]">
                  {notification.title}
                </Text>
                <StatusPill
                  label={notification.tone}
                  tone={notification.tone}
                />
              </View>
              <Text className="mt-2 text-base leading-7 text-[#5f6772]">
                {notification.body}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </AppScreen>
  );
}
