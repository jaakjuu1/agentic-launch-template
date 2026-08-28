import { SignedIn, SignedOut } from "@clerk/clerk-expo";
import { colors } from "@launch/design-tokens";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAppMode } from "@/lib/app-mode";

/**
 * Entry route. Offline and demo modes go straight to the tabs; Clerk
 * mode routes through auth state (spinner while Clerk loads, since
 * neither control component renders until then).
 */
export default function IndexScreen() {
  const mode = useAppMode();

  if (mode !== "clerk") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color={colors.accent} size="large" />
      <SignedIn>
        <Redirect href="/(tabs)" />
      </SignedIn>
      <SignedOut>
        <Redirect href="/sign-in" />
      </SignedOut>
    </View>
  );
}
