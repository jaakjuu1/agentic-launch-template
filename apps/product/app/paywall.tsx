import { AppScreen, PrimaryButton, SectionCard } from "@launch/ui-native";
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function PaywallScreen() {
  return (
    <AppScreen>
      <SectionCard eyebrow="Premium" title="Hybrid billing starter">
        <Text className="text-base leading-7 text-[#5f6772]">
          Stripe powers web checkout, RevenueCat powers mobile stores, and
          Convex normalizes the entitlement state so every surface agrees on
          access.
        </Text>
        <View className="gap-3 rounded-[20px] bg-[#fff3eb] p-4">
          <Text className="text-lg font-semibold text-[#16202a]">
            Pro monthly
          </Text>
          <Text className="text-base leading-7 text-[#5f6772]">
            Unlimited artifacts, priority queue, notifications, and
            operator-assisted recovery flows.
          </Text>
        </View>
        <PrimaryButton label="Start checkout wiring" />
        <Link href="/settings">
          <Text className="text-center text-sm font-medium text-[#16202a]">
            Restore purchases and entitlement diagnostics
          </Text>
        </Link>
      </SectionCard>
    </AppScreen>
  );
}
