"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { type ReactNode, useState } from "react";

/**
 * Client-side Convex provider wired to Clerk auth.
 *
 * The deployment URL is passed in from the server component after it has
 * verified the env var exists, so this module never touches env at import
 * time — the app must stay bootable with no env configured. The client is
 * created lazily (inside useState) so merely importing this file is free.
 */
export function ConvexClientProvider({
  children,
  convexUrl,
}: {
  children: ReactNode;
  convexUrl: string;
}) {
  const [client] = useState(() => new ConvexReactClient(convexUrl));

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
