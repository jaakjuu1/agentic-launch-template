import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from "@launch/ui-native";
import { CloudOff } from "lucide-react-native";
import { Component, type PropsWithChildren, type ReactNode } from "react";

import { getErrorMessage } from "@/lib/errors";

type ScreenBoundaryState = { error: unknown };

/**
 * Convex `useQuery` surfaces backend failures by throwing during render
 * (for example "Not authenticated" when a demo client talks to a
 * non-demo deployment). This boundary keeps those failures inline and
 * recoverable instead of blanking the whole app.
 */
export class ScreenBoundary extends Component<
  PropsWithChildren,
  ScreenBoundaryState
> {
  override state: ScreenBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ScreenBoundaryState {
    return { error };
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <Card className="gap-3 rounded-3xl py-5">
          <CardHeader className="gap-3 px-5">
            <Text className="text-xs uppercase tracking-[2px] text-muted-foreground">
              Connection issue
            </Text>
            <CardTitle className="text-[28px] leading-tight">
              Live data unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3 px-5">
            <Alert icon={CloudOff} variant="destructive">
              <AlertDescription>
                {getErrorMessage(this.state.error)}
              </AlertDescription>
            </Alert>
            <Button
              className="rounded-full"
              onPress={() => this.setState({ error: null })}
            >
              <Text>Try again</Text>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
