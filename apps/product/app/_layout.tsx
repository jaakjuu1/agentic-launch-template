import "react-native-url-polyfill/auto";
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/providers/app-providers";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          animation: "fade",
          contentStyle: { backgroundColor: "#f5efe6" },
          headerShown: false,
        }}
      />
    </AppProviders>
  );
}
