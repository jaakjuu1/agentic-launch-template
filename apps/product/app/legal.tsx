import { AppScreen, SectionCard } from "@launch/ui-native";
import { Text } from "react-native";

export default function LegalScreen() {
  return (
    <AppScreen>
      <SectionCard eyebrow="Legal" title="Privacy-first defaults">
        <Text className="text-base leading-7 text-[#5f6772]">
          This template assumes explicit consent for growth analytics where
          required, auditable AI side effects, clear subscription restoration,
          and account export/delete controls before launch.
        </Text>
      </SectionCard>
    </AppScreen>
  );
}
