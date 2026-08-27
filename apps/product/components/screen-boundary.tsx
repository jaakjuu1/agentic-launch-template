import { PrimaryButton, SectionCard } from "@launch/ui-native";
import { Component, type PropsWithChildren, type ReactNode } from "react";
import { Text } from "react-native";

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
        <SectionCard eyebrow="Connection issue" title="Live data unavailable">
          <Text className="text-base leading-7 text-[#b3261e]">
            {getErrorMessage(this.state.error)}
          </Text>
          <PrimaryButton
            label="Try again"
            onPress={() => this.setState({ error: null })}
          />
        </SectionCard>
      );
    }

    return this.props.children;
  }
}
