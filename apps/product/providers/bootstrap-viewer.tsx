import { api } from "@launch/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef } from "react";

/**
 * Fires the idempotent `bootstrap.bootstrapViewer` mutation once per
 * app start (and once per sign-in in Clerk mode) so the viewer profile —
 * and, on DEMO_MODE deployments, the demo records — exist before the
 * screens query for them.
 */
export function BootstrapViewer({ requireAuth }: { requireAuth: boolean }) {
  const { isAuthenticated } = useConvexAuth();
  const bootstrapViewer = useMutation(api.bootstrap.bootstrapViewer);
  const startedRef = useRef(false);

  const ready = requireAuth ? isAuthenticated : true;

  useEffect(() => {
    if (!ready) {
      // Signed out (or auth still loading): re-arm so the next sign-in
      // bootstraps the new viewer.
      startedRef.current = false;
      return;
    }

    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    bootstrapViewer({}).catch((error) => {
      // Non-fatal: screens surface their own query errors. Common cause
      // is an anonymous client against a deployment without DEMO_MODE.
      console.warn("bootstrapViewer failed", error);
    });
  }, [bootstrapViewer, ready]);

  return null;
}
