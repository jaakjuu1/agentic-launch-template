import { productConfig } from "@launch/config/product";
import {
  AppScreen,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Text,
} from "@launch/ui-native";
import * as Linking from "expo-linking";
import { Pressable, View } from "react-native";

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
      <View className="flex-row items-center justify-between rounded-2xl bg-popover/80 px-4 py-3">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <Text className="text-xs text-muted-foreground">{url}</Text>
      </View>
    </Pressable>
  );
}

export default function LegalScreen() {
  const { company, urls } = productConfig;

  return (
    <AppScreen>
      <Card className="gap-3 rounded-3xl py-5">
        <CardHeader className="gap-3 px-5">
          <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
            Legal
          </Text>
          <CardTitle className="text-[28px] leading-tight">
            Privacy-first defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3 px-5">
          <CardDescription className="text-base leading-7">
            {productConfig.name} is operated by {company.legalName}. This
            template assumes explicit consent for growth analytics where
            required, auditable AI side effects, clear subscription restoration,
            and account export/delete controls before launch.
          </CardDescription>
          <View className="gap-3">
            <LinkRow label="Terms & privacy" url={resolveUrl(urls.legal)} />
            <LinkRow label="Website" url={resolveUrl(urls.marketing)} />
            <LinkRow label="Service status" url={resolveUrl(urls.status)} />
            <LinkRow
              label="Contact support"
              url={`mailto:${company.supportEmail}`}
            />
          </View>
          <Text className="text-sm leading-6 text-muted-foreground">
            Replace these destinations in packages/config/src/product.ts when
            cloning the template.
          </Text>
        </CardContent>
      </Card>
    </AppScreen>
  );
}
