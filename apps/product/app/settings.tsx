import { AppScreen, SectionCard, StatusPill } from "@launch/ui-native";
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function SettingsScreen() {
  return (
    <AppScreen>
      <SectionCard
        eyebrow="Settings"
        title="Launch hardening already scaffolded"
      >
        <View className="gap-4">
          <View className="rounded-[20px] bg-white/80 p-4">
            <Text className="text-lg font-semibold text-[#16202a]">
              Notifications
            </Text>
            <Text className="mt-2 text-base leading-7 text-[#5f6772]">
              Permission copy, push token registration, and digest preferences
              live here.
            </Text>
            <View className="mt-3">
              <StatusPill label="push + email" tone="success" />
            </View>
          </View>
          <View className="rounded-[20px] bg-white/80 p-4">
            <Text className="text-lg font-semibold text-[#16202a]">
              Privacy and compliance
            </Text>
            <Text className="mt-2 text-base leading-7 text-[#5f6772]">
              Consent gates, export/delete flows, subscription restore, and
              legal screens are part of the starter instead of post-launch
              cleanup.
            </Text>
          </View>
        </View>
        <Link href="/legal">
          <Text className="text-sm font-medium text-[#16202a]">
            Open legal + privacy copy
          </Text>
        </Link>
      </SectionCard>
    </AppScreen>
  );
}
