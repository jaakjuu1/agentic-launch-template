import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@launch/design-tokens";
import { Redirect, Tabs } from "expo-router";

import { useAppMode } from "@/lib/app-mode";

const tabIcon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) => (
    <Ionicons color={color} name={name} size={size} />
  );

/**
 * Mounted only in Clerk mode: kicks signed-out visitors (deep links,
 * post-sign-out) back to the sign-in screen so live queries never mount
 * unauthenticated.
 */
function ClerkAuthGuard() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && !isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return null;
}

export default function TabsLayout() {
  const mode = useAppMode();

  return (
    <>
      {mode === "clerk" ? <ClerkAuthGuard /> : null}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 84,
            paddingTop: 8,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: tabIcon("home-outline"),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: "Projects",
            tabBarIcon: tabIcon("folder-open-outline"),
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: "Assistant",
            tabBarIcon: tabIcon("sparkles-outline"),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Inbox",
            tabBarIcon: tabIcon("notifications-outline"),
          }}
        />
      </Tabs>
    </>
  );
}
