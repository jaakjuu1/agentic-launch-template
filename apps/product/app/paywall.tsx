import { productConfig } from "@launch/config/product";
import { api } from "@launch/convex/_generated/api";
import {
  AppScreen,
  PrimaryButton,
  SectionCard,
  StatusPill,
} from "@launch/ui-native";
import { useMutation, useQuery } from "convex/react";
import { Link } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { ScreenBoundary } from "@/components/screen-boundary";
import { EmptyText, ErrorText } from "@/components/status-blocks";
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
    <View className="gap-3 rounded-[20px] bg-[#fff3eb] p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-lg font-semibold text-[#16202a]">
          {tier.name}
        </Text>
        <Text className="text-base font-semibold text-[#ff6b35]">
          {tier.displayPrice}
        </Text>
      </View>
      <Text className="text-base leading-7 text-[#5f6772]">
        {tier.description}
      </Text>
      <View className="gap-1">
        {tier.features.map((feature) => (
          <Text className="text-sm leading-6 text-[#16202a]" key={feature}>
            · {feature}
          </Text>
        ))}
      </View>
      {isCurrent ? <StatusPill label="Current plan" tone="success" /> : null}
    </View>
  );
}

function BillingHonestyNote() {
  return (
    <Text className="text-sm leading-6 text-[#7b838e]">
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
        <PrimaryButton
          label={pending ? "Unlocking…" : "Unlock Pro (demo)"}
          onPress={() => void unlock()}
        />
        {granted ? (
          <Text className="text-sm leading-6 text-[#1b7f5b]">
            Preview Pro entitlement granted.
          </Text>
        ) : null}
        <ErrorText message={error} />
        <BillingHonestyNote />
      </View>

      <View className="gap-3">
        <Text className="text-xs uppercase tracking-[1.6px] text-[#5f6772]">
          Your entitlements
        </Text>
        {entitlements === undefined ? (
          <EmptyText message="Loading entitlements…" />
        ) : entitlements.length === 0 ? (
          <EmptyText message="No entitlement records yet — you are on the free tier." />
        ) : (
          entitlements.map((entitlement) => (
            <View
              className="flex-row items-center justify-between rounded-[20px] bg-white/80 px-4 py-3"
              key={entitlement._id}
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#16202a]">
                  {entitlement.productKey}
                </Text>
                <Text className="text-xs uppercase tracking-[1.2px] text-[#5f6772]">
                  via {entitlement.source}
                </Text>
              </View>
              <StatusPill
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
      <SectionCard eyebrow="Premium" title={`${productConfig.name} Pro`}>
        {mode === "offline" ? (
          <OfflinePaywall />
        ) : (
          <ScreenBoundary>
            <LivePaywall />
          </ScreenBoundary>
        )}
        <Link href="/settings">
          <Text className="text-center text-sm font-medium text-[#16202a]">
            Entitlement details and consents live in Settings
          </Text>
        </Link>
      </SectionCard>
    </AppScreen>
  );
}
