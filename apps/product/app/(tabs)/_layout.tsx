import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const tabIcon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) => (
    <Ionicons color={color} name={name} size={size} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16202a",
        tabBarInactiveTintColor: "#7b838e",
        tabBarStyle: {
          backgroundColor: "#fffaf4",
          borderTopColor: "rgba(22, 32, 42, 0.08)",
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
  );
}
