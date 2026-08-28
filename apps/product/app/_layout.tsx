import "react-native-url-polyfill/auto";
import "../global.css";

import { colors } from "@launch/design-tokens";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { ModeBanner } from "@/components/mode-banner";
import { AppProviders } from "@/providers/app-providers";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <View className="flex-1 bg-background">
        <ModeBanner />
        <Stack
          screenOptions={{
            animation: "fade",
            contentStyle: { backgroundColor: colors.background },
            headerShown: false,
          }}
        />
      </View>
      {/* Render target for dialogs/popovers from @launch/ui-native. */}
      <PortalHost />
    </AppProviders>
  );
}
