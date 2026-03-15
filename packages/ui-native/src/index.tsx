import type { PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#16202a",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonLabel: {
    color: "#fffaf4",
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fffaf4",
    borderColor: "rgba(22, 32, 42, 0.1)",
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  cardEyebrow: {
    color: "#5f6772",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#16202a",
    fontSize: 28,
    fontWeight: "600",
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  screen: {
    backgroundColor: "#f5efe6",
    flex: 1,
  },
  screenContent: {
    gap: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
});

export function AppScreen({ children }: PropsWithChildren) {
  return (
    <ScrollView
      contentContainerStyle={styles.screenContent}
      style={styles.screen}
    >
      {children}
    </ScrollView>
  );
}

export function SectionCard({
  children,
  eyebrow,
  title,
}: PropsWithChildren<{ eyebrow: string; title: string }>) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardEyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning";
}) {
  const backgroundColor =
    tone === "success" ? "#d8f7ea" : tone === "warning" ? "#ffe2c4" : "#e6e1d8";
  const color =
    tone === "success" ? "#1b7f5b" : tone === "warning" ? "#b85c00" : "#5f6772";

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}
