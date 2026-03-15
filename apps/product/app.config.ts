import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Agentic Launch",
  slug: "agentic-launch-template",
  scheme: "agentic-launch",
  orientation: "portrait",
  userInterfaceStyle: "light",
  plugins: ["expo-router", "expo-secure-store", "expo-notifications"],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: "com.example.agenticlaunch",
    supportsTablet: true,
    infoPlist: {
      NSUserTrackingUsageDescription:
        "We use privacy-safe analytics to improve conversion and retention.",
      NSUserNotificationsUsageDescription:
        "Notifications keep you updated when workflows finish or approvals need attention.",
    },
  },
  android: {
    package: "com.example.agenticlaunch",
    adaptiveIcon: {
      backgroundColor: "#f5efe6",
    },
    permissions: ["POST_NOTIFICATIONS"],
  },
  web: {
    bundler: "metro",
    output: "single",
  },
  extra: {
    eas: {
      projectId: "replace-in-eas",
    },
  },
};

export default config;
