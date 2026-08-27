import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppMode } from "@/lib/app-mode";

const bannerCopy = {
  demo: "Demo mode — anonymous shared viewer",
  offline: "Offline demo — set EXPO_PUBLIC_CONVEX_URL to go live",
} as const;

/**
 * Small dismissible strip shown at the top of the app in offline and
 * demo modes so nobody mistakes fixture/shared data for their own.
 */
export function ModeBanner() {
  const mode = useAppMode();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);

  if (mode === "clerk" || dismissed) {
    return null;
  }

  return (
    <View
      className="flex-row items-center justify-between gap-3 bg-[#16202a] px-5 pb-3"
      style={{ paddingTop: Math.max(insets.top, 12) }}
    >
      <Text className="flex-1 text-xs font-medium leading-5 text-[#ffd4c7]">
        {bannerCopy[mode]}
      </Text>
      <Pressable
        accessibilityLabel="Dismiss banner"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setDismissed(true)}
      >
        <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-[#fffaf4]">
          Dismiss
        </Text>
      </Pressable>
    </View>
  );
}
