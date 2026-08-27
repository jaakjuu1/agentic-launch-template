import { useConvexAuth } from "convex/react";

import { useAppMode } from "@/lib/app-mode";

/**
 * Whether live Convex queries may mount their args right now.
 *
 * - "demo" mode always queries (the deployment's DEMO_MODE flag decides
 *   whether anonymous access works; failures surface via the screen
 *   error boundary).
 * - "clerk" mode must wait for an authenticated Convex connection —
 *   anonymous callers on non-demo deployments throw "Not authenticated".
 *
 * Only call this under a Convex provider (i.e. inside live screens).
 */
export function useLiveQueriesEnabled(): boolean {
  const mode = useAppMode();
  const { isAuthenticated } = useConvexAuth();
  return mode === "clerk" ? isAuthenticated : true;
}
