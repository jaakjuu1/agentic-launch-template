import { useAuth } from "@clerk/clerk-expo";
import { api } from "@launch/convex/_generated/api";
import { seedPreview } from "@launch/domain";
import {
  AppScreen,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Text,
} from "@launch/ui-native";
import { useMutation, useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { ScreenBoundary } from "@/components/screen-boundary";
import {
  EmptyText,
  ErrorText,
  LoadingCard,
  StatusBadge,
} from "@/components/status-blocks";
import { useAppMode } from "@/lib/app-mode";
import { resolveActiveTier } from "@/lib/entitlements";
import { getErrorMessage } from "@/lib/errors";
import { referenceEntitlements } from "@/lib/reference-data";
import { useLiveQueriesEnabled } from "@/lib/use-live-enabled";

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-foreground">
        {value}
      </Text>
    </View>
  );
}

function ConsentSwitch({
  description,
  disabled,
  label,
  onChange,
  value,
}: {
  description: string;
  disabled?: boolean;
  label: string;
  onChange?: (next: boolean) => void;
  value: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4 rounded-2xl bg-popover/80 p-4">
      <View className="flex-1">
        <Label className="text-base font-semibold">{label}</Label>
        <Text className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </Text>
      </View>
      <Switch
        checked={value}
        disabled={disabled}
        onCheckedChange={(next) => onChange?.(next)}
      />
    </View>
  );
}

function SignOutRow() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (pending) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (signOutError) {
      setError(getErrorMessage(signOutError));
      setPending(false);
    }
  };

  return (
    <View className="gap-2">
      <Button className="rounded-full" onPress={() => void handleSignOut()}>
        <Text>{pending ? "Signing out…" : "Sign out"}</Text>
      </Button>
      <ErrorText message={error} />
    </View>
  );
}

function LiveSettings() {
  const enabled = useLiveQueriesEnabled();
  const profile = useQuery(api.profiles.viewerProfile, enabled ? {} : "skip");
  const entitlements = useQuery(
    api.billing.listEntitlements,
    enabled ? {} : "skip",
  );
  const updateConsents = useMutation(api.profiles.updateConsents);

  const [pendingConsent, setPendingConsent] = useState<
    "analytics" | "marketing" | null
  >(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [analyticsOverride, setAnalyticsOverride] = useState<boolean | null>(
    null,
  );
  const [marketingOverride, setMarketingOverride] = useState<boolean | null>(
    null,
  );

  if (profile === undefined) {
    return <LoadingCard title="Settings" />;
  }

  const toggleConsent = async (
    kind: "analytics" | "marketing",
    next: boolean,
  ) => {
    if (pendingConsent !== null) {
      return;
    }
    setPendingConsent(kind);
    setConsentError(null);
    const setOverride =
      kind === "analytics" ? setAnalyticsOverride : setMarketingOverride;
    setOverride(next);
    try {
      await updateConsents(
        kind === "analytics"
          ? { analyticsConsent: next }
          : { marketingConsent: next },
      );
    } catch (toggleError) {
      setConsentError(getErrorMessage(toggleError));
    } finally {
      // The reactive profile query is the source of truth again.
      setOverride(null);
      setPendingConsent(null);
    }
  };

  const activeTier = resolveActiveTier(entitlements ?? []);

  return (
    <>
      <View className="gap-3 rounded-2xl bg-popover/80 p-4">
        <Text className="text-lg font-semibold text-foreground">Profile</Text>
        {profile === null ? (
          <EmptyText message="Profile not created yet — it appears after the first sync with the backend." />
        ) : (
          <View className="gap-2">
            <ProfileRow
              label="Name"
              value={`${profile.firstName}${
                profile.lastName ? ` ${profile.lastName}` : ""
              }`}
            />
            <ProfileRow
              label="Email"
              value={profile.email.length > 0 ? profile.email : "—"}
            />
            <ProfileRow label="Locale" value={profile.locale} />
            <ProfileRow label="Timezone" value={profile.timezone} />
            <ProfileRow label="Role" value={profile.role} />
          </View>
        )}
      </View>

      <ConsentSwitch
        description="Allow privacy-safe product analytics to improve the app."
        disabled={profile === null || pendingConsent !== null}
        label="Analytics consent"
        onChange={(next) => void toggleConsent("analytics", next)}
        value={analyticsOverride ?? profile?.analyticsConsent ?? false}
      />
      <ConsentSwitch
        description="Receive occasional product news and launch updates."
        disabled={profile === null || pendingConsent !== null}
        label="Marketing consent"
        onChange={(next) => void toggleConsent("marketing", next)}
        value={marketingOverride ?? profile?.marketingConsent ?? false}
      />
      <ErrorText message={consentError} />

      <View className="gap-3 rounded-2xl bg-popover/80 p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-lg font-semibold text-foreground">
            Entitlements
          </Text>
          <StatusBadge
            label={activeTier}
            tone={activeTier === "free" ? "neutral" : "success"}
          />
        </View>
        {entitlements === undefined ? (
          <EmptyText message="Loading entitlements…" />
        ) : entitlements.length === 0 ? (
          <EmptyText message="No entitlement records — free tier." />
        ) : (
          entitlements.map((entitlement) => (
            <ProfileRow
              key={entitlement._id}
              label={`${entitlement.productKey} · ${entitlement.source}`}
              value={entitlement.active ? "active" : "inactive"}
            />
          ))
        )}
      </View>
    </>
  );
}

function OfflineSettings() {
  return (
    <>
      <View className="gap-3 rounded-2xl bg-popover/80 p-4">
        <Text className="text-lg font-semibold text-foreground">Profile</Text>
        <View className="gap-2">
          <ProfileRow label="Name" value={seedPreview.profile.firstName} />
          <ProfileRow label="Email" value={seedPreview.profile.email} />
          <ProfileRow label="Locale" value={seedPreview.profile.locale} />
          <ProfileRow label="Role" value={seedPreview.profile.role} />
        </View>
      </View>
      <ConsentSwitch
        description="Allow privacy-safe product analytics to improve the app."
        disabled
        label="Analytics consent"
        value={seedPreview.profile.analyticsConsent}
      />
      <ConsentSwitch
        description="Receive occasional product news and launch updates."
        disabled
        label="Marketing consent"
        value={seedPreview.profile.marketingConsent}
      />
      <View className="gap-3 rounded-2xl bg-popover/80 p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-lg font-semibold text-foreground">
            Entitlements
          </Text>
          <StatusBadge
            label={referenceEntitlements.activeTier}
            tone="success"
          />
        </View>
      </View>
      <EmptyText message="Offline demo — consents and entitlements become editable once a Convex deployment is configured." />
    </>
  );
}

export default function SettingsScreen() {
  const mode = useAppMode();

  return (
    <AppScreen>
      <Card className="gap-3 rounded-3xl py-5">
        <CardHeader className="gap-3 px-5">
          <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
            Settings
          </Text>
          <CardTitle className="text-[28px] leading-tight">
            Account, consents, and plan
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-3 px-5">
          {mode === "offline" ? (
            <OfflineSettings />
          ) : (
            <ScreenBoundary>
              <LiveSettings />
            </ScreenBoundary>
          )}
          {mode === "clerk" ? <SignOutRow /> : null}
          <Link href="/legal">
            <Text className="text-sm font-medium text-foreground">
              Open legal + privacy copy
            </Text>
          </Link>
        </CardContent>
      </Card>
    </AppScreen>
  );
}
