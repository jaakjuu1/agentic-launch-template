import { seedPreview } from "@launch/domain";
import { AppScreen, PrimaryButton, SectionCard } from "@launch/ui-native";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { MetricCard } from "@/components/metric-card";
import { dashboardStats, referenceEntitlements } from "@/lib/reference-data";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <View className="gap-6">
        <View className="rounded-[32px] bg-[#16202a] px-6 py-7">
          <Text className="text-xs uppercase tracking-[2px] text-[#ffd4c7]">
            Launch template
          </Text>
          <Text className="mt-3 text-4xl font-semibold leading-[44px] text-[#fffaf4]">
            Agentic productivity, built for app-store launch.
          </Text>
          <Text className="mt-3 text-base leading-7 text-[#f3e9dc]">
            Shared mobile + web foundation, durable agent workflows, approvals,
            billing, and operator tooling from day one.
          </Text>
          <View className="mt-5 flex-row flex-wrap gap-3">
            <PrimaryButton
              label="Open premium flow"
              onPress={() => router.push("/paywall")}
            />
          </View>
        </View>

        <SectionCard
          eyebrow={`Welcome, ${seedPreview.profile.firstName}`}
          title="Production posture"
        >
          <View className="flex-row flex-wrap gap-3">
            {dashboardStats.map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </SectionCard>

        <SectionCard
          eyebrow="Revenue"
          title="Entitlements stay canonical in Convex"
        >
          <Text className="text-base leading-7 text-[#5f6772]">
            Web checkout and mobile purchases reconcile into one durable
            entitlement model.
          </Text>
          <View className="flex-row items-center justify-between rounded-[20px] bg-[#fff3eb] px-4 py-3">
            <Text className="text-sm font-medium text-[#16202a]">
              Active tier
            </Text>
            <Text className="text-base font-semibold uppercase tracking-[1.4px] text-[#ff6b35]">
              {referenceEntitlements.activeTier}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <PrimaryButton
              label="Settings"
              onPress={() => router.push("/settings")}
            />
            <PrimaryButton
              label="Support"
              onPress={() => router.push("/support")}
            />
          </View>
        </SectionCard>
      </View>
    </AppScreen>
  );
}
