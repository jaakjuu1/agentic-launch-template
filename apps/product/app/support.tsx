import { AppScreen, PrimaryButton, SectionCard } from "@launch/ui-native";
import { Text, View } from "react-native";

export default function SupportScreen() {
  return (
    <AppScreen>
      <SectionCard
        eyebrow="Support"
        title="Operator-ready support request flow"
      >
        <Text className="text-base leading-7 text-[#5f6772]">
          Support requests become first-class Convex records, can trigger email
          acknowledgements, and can be escalated to operators without leaking
          internal controls into prompts.
        </Text>
        <View className="rounded-[20px] bg-white/80 p-4">
          <Text className="text-lg font-semibold text-[#16202a]">
            Suggested templates
          </Text>
          <Text className="mt-2 text-base leading-7 text-[#5f6772]">
            Billing issue, account recovery, notification mismatch, or approval
            escalation.
          </Text>
        </View>
        <PrimaryButton label="Create support request action" />
      </SectionCard>
    </AppScreen>
  );
}
