import "react-native-url-polyfill/auto";
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { ModeBanner } from "@/components/mode-banner";
import { AppProviders } from "@/providers/app-providers";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <View className="flex-1 bg-[#f5efe6]">
        <ModeBanner />
        <Stack
          screenOptions={{
            animation: "fade",
            contentStyle: { backgroundColor: "#f5efe6" },
            headerShown: false,
          }}
        />
      </View>
    </AppProviders>
  );
}
