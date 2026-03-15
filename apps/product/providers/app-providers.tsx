import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { PropsWithChildren } from "react";

import { productEnv } from "@/lib/env";

const convexClient = productEnv.EXPO_PUBLIC_CONVEX_URL
  ? new ConvexReactClient(productEnv.EXPO_PUBLIC_CONVEX_URL)
  : null;

export function AppProviders({ children }: PropsWithChildren) {
  if (!productEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || convexClient === null) {
    return children;
  }

  return (
    <ClerkProvider
      publishableKey={productEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
