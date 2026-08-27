import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { PropsWithChildren } from "react";

import { getAppMode } from "@/lib/app-mode";
import { productEnv } from "@/lib/env";
import { BootstrapViewer } from "@/providers/bootstrap-viewer";

const convexClient = productEnv.EXPO_PUBLIC_CONVEX_URL
  ? new ConvexReactClient(productEnv.EXPO_PUBLIC_CONVEX_URL)
  : null;

/**
 * Provider stack per app mode:
 * - offline: no providers — screens render bundled fixtures.
 * - demo: plain ConvexProvider (anonymous shared viewer; the deployment
 *   must run with DEMO_MODE=true).
 * - clerk: ClerkProvider + ConvexProviderWithClerk with the secure-store
 *   backed token cache.
 */
export function AppProviders({ children }: PropsWithChildren) {
  const mode = getAppMode();

  if (mode === "offline" || convexClient === null) {
    return children;
  }

  if (mode === "demo" || !productEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <ConvexProvider client={convexClient}>
        <BootstrapViewer requireAuth={false} />
        {children}
      </ConvexProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={productEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <BootstrapViewer requireAuth />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
