import type { ExpoConfig } from "expo/config";

// Imported from source (not the built package) so `expo start` works
// without building workspace packages first.
import { productConfig } from "../../packages/config/src/product";

const config: ExpoConfig = {
  name: productConfig.name,
  slug: productConfig.slug,
  scheme: productConfig.mobile.scheme,
  orientation: "portrait",
  userInterfaceStyle: "light",
  plugins: ["expo-router", "expo-secure-store", "expo-notifications"],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: productConfig.mobile.iosBundleId,
    supportsTablet: true,
    infoPlist: {
      NSUserTrackingUsageDescription:
        "We use privacy-safe analytics to improve conversion and retention.",
      NSUserNotificationsUsageDescription:
        "Notifications keep you updated when workflows finish or approvals need attention.",
    },
  },
  android: {
    package: productConfig.mobile.androidPackage,
    adaptiveIcon: {
      backgroundColor: productConfig.branding.backgroundColor,
    },
    permissions: ["POST_NOTIFICATIONS"],
  },
  web: {
    bundler: "metro",
    output: "single",
  },
  extra: {
    eas: {
      projectId: productConfig.mobile.easProjectId,
    },
  },
};

export default config;
