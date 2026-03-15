import { SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

const checks = [
  {
    name: "Product app",
    status: "Operational",
    detail: "Expo builds, deep links, and notification rails are healthy.",
  },
  {
    name: "Convex workflows",
    status: "Operational",
    detail:
      "Reactive queries, approvals, and durable background jobs are processing normally.",
  },
  {
    name: "Billing and auth",
    status: "Operational",
    detail:
      "Clerk sign-in plus Stripe and RevenueCat entitlement sync are healthy.",
  },
];

export default function StatusPage() {
  return (
    <SiteShell>
      <section className="stack">
        <SurfaceCard className="stack" style={{ padding: 28 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Status
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 48,
              lineHeight: 1,
            }}
          >
            Launch systems snapshot
          </h1>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 18,
              lineHeight: 1.7,
            }}
          >
            Public-facing health page for the launch template. Replace the
            sample checks with your live monitors and incident feed.
          </p>
        </SurfaceCard>
        {checks.map((check) => (
          <SurfaceCard
            key={check.name}
            className="stack"
            style={{ padding: 24 }}
          >
            <div
              style={{
                color: "var(--launch-color-muted)",
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {check.status}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{check.name}</div>
            <div
              style={{ color: "var(--launch-color-muted)", lineHeight: 1.7 }}
            >
              {check.detail}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </SiteShell>
  );
}
