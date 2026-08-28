import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardTitle } from "./components/ui/card";
import { Text } from "./components/ui/text";
import { cn } from "./lib/utils";

/**
 * shadcn-style component kit for the Expo app, vendored from
 * react-native-reusables (NativeWind variant). The source lives in this
 * repo on purpose — restyle per product. Add more components by copying
 * them from https://reactnativereusables.com/ into ./components/ui and
 * re-exporting here.
 *
 * Colors/radii come from the shared Tailwind preset
 * (@launch/design-tokens/tailwind-preset) — use semantic classes
 * (bg-background, text-muted-foreground, ...) instead of raw hex.
 */

export { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./components/ui/avatar";
export { Badge, badgeTextVariants, badgeVariants } from "./components/ui/badge";
export {
  Button,
  buttonTextVariants,
  buttonVariants,
  type ButtonProps,
} from "./components/ui/button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
export { Icon } from "./components/ui/icon";
export { Input } from "./components/ui/input";
export { Label } from "./components/ui/label";
export { Progress } from "./components/ui/progress";
export { Separator } from "./components/ui/separator";
export { Skeleton } from "./components/ui/skeleton";
export { Switch } from "./components/ui/switch";
export { Text, TextClassContext } from "./components/ui/text";
export { Textarea } from "./components/ui/textarea";
export { cn } from "./lib/utils";

/* ------------------------------------------------------------------ */
/* Legacy primitives — thin wrappers over the kit, kept so screens     */
/* migrate incrementally. Prefer the components above in new code.     */
/* ------------------------------------------------------------------ */

/** @deprecated Compose ScrollView + semantic classes directly. */
export function AppScreen({ children }: PropsWithChildren) {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-6 pb-16"
    >
      {children}
    </ScrollView>
  );
}

/** @deprecated Use Card/CardHeader/CardTitle/CardContent. */
export function SectionCard({
  children,
  eyebrow,
  title,
}: PropsWithChildren<{ eyebrow: string; title: string }>) {
  return (
    <Card className="gap-3 rounded-3xl py-5">
      <CardContent className="gap-3 px-5">
        <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
          {eyebrow}
        </Text>
        <CardTitle className="text-[28px] leading-tight">{title}</CardTitle>
        <View className="gap-3">{children}</View>
      </CardContent>
    </Card>
  );
}

/** @deprecated Use Button + Text. */
export function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Button className="rounded-full" onPress={onPress}>
      <Text>{label}</Text>
    </Button>
  );
}

/** @deprecated Use Badge with a variant. */
export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <Badge
      className={cn(
        "self-start rounded-full border-0 px-3 py-1.5",
        tone === "success" && "bg-success/15",
        tone === "warning" && "bg-warning/15",
        tone === "neutral" && "bg-muted",
      )}
    >
      <Text
        className={cn(
          "text-xs font-semibold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "neutral" && "text-muted-foreground",
        )}
      >
        {label}
      </Text>
    </Badge>
  );
}
