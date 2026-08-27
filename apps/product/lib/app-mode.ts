import { productEnv } from "@/lib/env";

export type AppMode = "offline" | "demo" | "clerk";

/**
 * The app mode is derived from build-time env vars and is constant for
 * the lifetime of the app:
 *
 * - "offline": no `EXPO_PUBLIC_CONVEX_URL` — no Convex provider is
 *   mounted and every screen renders the bundled fixtures.
 * - "demo": Convex URL set but no Clerk key — plain ConvexProvider with
 *   an anonymous shared viewer (requires DEMO_MODE=true on the
 *   deployment).
 * - "clerk": Convex URL and Clerk publishable key set — real accounts.
 */
export function getAppMode(): AppMode {
  if (!productEnv.EXPO_PUBLIC_CONVEX_URL) {
    return "offline";
  }

  if (!productEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return "demo";
  }

  return "clerk";
}

/**
 * Hook flavor for components. The value can never change at runtime, so
 * it is safe to branch which subtree (offline vs live) gets mounted.
 */
export function useAppMode(): AppMode {
  return getAppMode();
}
