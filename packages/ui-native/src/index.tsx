import type { PropsWithChildren } from "react";
import { ScrollView } from "react-native";

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
  type ButtonProps,
  buttonTextVariants,
  buttonVariants,
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

/** Standard screen scroll container: token background + page padding. */
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
