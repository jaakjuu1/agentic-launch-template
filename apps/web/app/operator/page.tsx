import { productConfig } from "@launch/config/product";
import { SurfaceCard } from "@launch/ui-web";

import { ConvexClientProvider } from "@/components/convex-client-provider";
import { OperatorConsole } from "@/components/operator-console";
import { SiteShell } from "@/components/site-shell";

type EnvRequirement = {
  name: string;
  purpose: string;
  value: string | undefined;
};

function getEnvRequirements(): EnvRequirement[] {
  return [
    {
      name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      purpose: "Clerk publishable key — mounts ClerkProvider and sign-in.",
      value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },
    {
      name: "CLERK_SECRET_KEY",
      purpose: "Clerk secret key — lets the middleware verify sessions.",
      value: process.env.CLERK_SECRET_KEY,
    },
    {
      name: "NEXT_PUBLIC_CONVEX_URL",
      purpose: "Convex deployment URL — where the console reads live data.",
      value: process.env.NEXT_PUBLIC_CONVEX_URL,
    },
  ];
}

function OperatorSetupCard({
  requirements,
}: {
  requirements: EnvRequirement[];
}) {
  return (
    <SurfaceCard className="stack" style={{ padding: 32 }}>
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        Operator console
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 44,
          lineHeight: 1.05,
          margin: 0,
        }}
      >
        Almost there — connect Clerk and Convex
      </h1>
      <p
        style={{
          color: "var(--launch-color-muted)",
          fontSize: 17,
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        The operator console for {productConfig.name} reads live data from
        Convex behind Clerk authentication. This deployment is missing
        configuration, so the console is showing this setup guide instead of
        crashing. Set the following environment variables (see
        apps/web/.env.example), then restart the app:
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {requirements.map((requirement) => (
          <div className="row-item" key={requirement.name}>
            <div className="row-item-head">
              <code style={{ fontSize: 15, fontWeight: 700 }}>
                {requirement.name}
              </code>
              <span
                className={
                  requirement.value
                    ? "pill-badge pill-badge--success"
                    : "pill-badge pill-badge--accent"
                }
              >
                {requirement.value ? "set" : "missing"}
              </span>
            </div>
            <div
              style={{
                color: "var(--launch-color-muted)",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              {requirement.purpose}
            </div>
          </div>
        ))}
      </div>
      <p
        style={{
          color: "var(--launch-color-muted)",
          fontSize: 15,
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        Once configured, sign in with a Clerk user whose public metadata sets
        the app:role claim to operator or admin — the Convex backend enforces
        that role on every operator query.
      </p>
    </SurfaceCard>
  );
}

export default function OperatorPage() {
  const requirements = getEnvRequirements();
  const missing = requirements.filter((requirement) => !requirement.value);
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (missing.length > 0 || !convexUrl) {
    return (
      <SiteShell>
        <OperatorSetupCard requirements={requirements} />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <ConvexClientProvider convexUrl={convexUrl}>
        <OperatorConsole />
      </ConvexClientProvider>
    </SiteShell>
  );
}
