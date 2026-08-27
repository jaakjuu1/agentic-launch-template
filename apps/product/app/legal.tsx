import { productConfig } from "@launch/config/product";
import { AppScreen, SectionCard } from "@launch/ui-native";
import * as Linking from "expo-linking";
import { Pressable, Text, View } from "react-native";

/** Resolve config URLs that may be relative to the marketing site. */
function resolveUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http")) {
    return pathOrUrl;
  }
  return `${productConfig.urls.marketing.replace(/\/$/, "")}${pathOrUrl}`;
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(url)}
    >
      <View className="flex-row items-center justify-between rounded-[20px] bg-white/80 px-4 py-3">
        <Text className="text-sm font-semibold text-[#16202a]">{label}</Text>
        <Text className="text-xs text-[#5f6772]">{url}</Text>
      </View>
    </Pressable>
  );
}

export default function LegalScreen() {
  const { company, urls } = productConfig;

  return (
    <AppScreen>
      <SectionCard eyebrow="Legal" title="Privacy-first defaults">
        <Text className="text-base leading-7 text-[#5f6772]">
          {productConfig.name} is operated by {company.legalName}. This template
          assumes explicit consent for growth analytics where required,
          auditable AI side effects, clear subscription restoration, and account
          export/delete controls before launch.
        </Text>
        <View className="gap-3">
          <LinkRow label="Terms & privacy" url={resolveUrl(urls.legal)} />
          <LinkRow label="Website" url={resolveUrl(urls.marketing)} />
          <LinkRow label="Service status" url={resolveUrl(urls.status)} />
          <LinkRow
            label="Contact support"
            url={`mailto:${company.supportEmail}`}
          />
        </View>
        <Text className="text-sm leading-6 text-[#7b838e]">
          Replace these destinations in packages/config/src/product.ts when
          cloning the template.
        </Text>
      </SectionCard>
    </AppScreen>
  );
}
