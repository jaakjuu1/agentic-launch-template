import { productConfig } from "@launch/config/product";
import { api } from "@launch/convex/_generated/api";
import {
  AppScreen,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from "@launch/ui-native";
import { useMutation, useQuery } from "convex/react";
import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { ScreenBoundary } from "@/components/screen-boundary";
import { EmptyText, ErrorText, StatusBadge } from "@/components/status-blocks";
import { useAppMode } from "@/lib/app-mode";
import { type EntitlementTier, resolveActiveTier } from "@/lib/entitlements";
import { getErrorMessage } from "@/lib/errors";
import { referenceEntitlements } from "@/lib/reference-data";
import { useLiveQueriesEnabled } from "@/lib/use-live-enabled";

function TierCard({
  activeTier,
  tier,
}: {
  activeTier: EntitlementTier;
  tier: (typeof productConfig.pricing.tiers)[number];
}) {
  const isCurrent = tier.tier === activeTier;

  return (
    <View className="gap-3 rounded-2xl bg-secondary/40 p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-lg font-semibold text-foreground">
          {tier.name}
        </Text>
        <Text className="text-base font-semibold text-primary">
          {tier.displayPrice}
        </Text>
      </View>
      <Text className="text-base leading-7 text-muted-foreground">
        {tier.description}
      </Text>
      <View className="gap-1">
        {tier.features.map((feature) => (
          <Text className="text-sm leading-6 text-foreground" key={feature}>
            · {feature}
          </Text>
        ))}
      </View>
      {isCurrent ? <StatusBadge label="Current plan" tone="success" /> : null}
    </View>
  );
}

function BillingHonestyNote() {
  return (
    <Text className="text-sm leading-6 text-muted-foreground">
      Store billing is not wired in this template build: the RevenueCat SDK
      (mobile stores) and Stripe checkout (web) are connected at launch time per
      docs/ROADMAP.md. Entitlements below are read live from Convex.
    </Text>
  );
}

function LivePaywall() {
  const enabled = useLiveQueriesEnabled();
  const entitlements = useQuery(
    api.billing.listEntitlements,
    enabled ? {} : "skip",
  );
  const grantPreviewPro = useMutation(api.billing.grantPreviewPro);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState(false);

  const activeTier = resolveActiveTier(entitlements ?? []);

  const unlock = async () => {
    if (pending) {
      return;
    }
    setPending(true);
    setError(null);
    setGranted(false);
    try {
      await grantPreviewPro({});
      setGranted(true);
    } catch (grantError) {
      // Throws unless the deployment runs with DEMO_MODE=true — show the
      // backend's explanation verbatim.
      setError(getErrorMessage(grantError));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <View className="gap-3">
        {productConfig.pricing.tiers.map((tier) => (
          <TierCard activeTier={activeTier} key={tier.productKey} tier={tier} />
        ))}
      </View>

      <View className="gap-3">
        <Button className="rounded-full" onPress={() => void unlock()}>
          <Text>{pending ? "Unlocking…" : "Unlock Pro (demo)"}</Text>
        </Button>
        {granted ? (
          <Text className="text-sm leading-6 text-success">
            Preview Pro entitlement granted.
          </Text>
        ) : null}
        <ErrorText message={error} />
        <BillingHonestyNote />
      </View>

      <View className="gap-3">
        <Text className="text-xs uppercase tracking-[1.6px] text-muted-foreground">
          Your entitlements
        </Text>
        {entitlements === undefined ? (
          <EmptyText message="Loading entitlements…" />
        ) : entitlements.length === 0 ? (
          <EmptyText message="No entitlement records yet — you are on the free tier." />
        ) : (
          entitlements.map((entitlement) => (
            <View
              className="flex-row items-center justify-between rounded-2xl bg-popover/80 px-4 py-3"
              key={entitlement._id}
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {entitlement.productKey}
                </Text>
                <Text className="text-xs uppercase tracking-[1.2px] text-muted-foreground">
                  via {entitlement.source}
                </Text>
              </View>
              <StatusBadge
                label={entitlement.active ? entitlement.tier : "inactive"}
                tone={entitlement.active ? "success" : "neutral"}
              />
            </View>
          ))
        )}
      </View>
    </>
  );
}

function OfflinePaywall() {
  return (
    <>
      <View className="gap-3">
        {productConfig.pricing.tiers.map((tier) => (
          <TierCard
            activeTier={referenceEntitlements.activeTier}
            key={tier.productKey}
            tier={tier}
          />
        ))}
      </View>
      <BillingHonestyNote />
      <EmptyText message="Offline demo — connect a Convex deployment to try the demo unlock and see live entitlements." />
    </>
  );
}

export default function PaywallScreen() {
  const mode = useAppMode();

  return (
    <AppScreen>
      <Card className="gap-3 rounded-3xl py-5">
        <CardHeader className="gap-3 px-5">
          <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
            Premium
          </Text>
          <CardTitle className="text-[28px] leading-tight">
            {`${productConfig.name} Pro`}
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3 px-5">
          {mode === "offline" ? (
            <OfflinePaywall />
          ) : (
            <ScreenBoundary>
              <LivePaywall />
            </ScreenBoundary>
          )}
          <Link href="/settings">
            <Text className="text-center text-sm font-medium text-foreground">
              Entitlement details and consents live in Settings
            </Text>
          </Link>
        </CardContent>
      </Card>
    </AppScreen>
  );
}
