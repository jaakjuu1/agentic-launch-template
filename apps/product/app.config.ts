// Imported from the built package: Expo's config loader transpiles only
// this file, so plain `require` must be able to resolve the import —
// workspace TS sources are not requireable here. Run `pnpm build` (or
// `pnpm --filter @launch/config build`) once after cloning.
import { productConfig } from "@launch/config/product";
import type { ExpoConfig } from "expo/config";

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
