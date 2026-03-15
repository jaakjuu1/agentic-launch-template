import { HeroButton, SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    copy: "Consumer onboarding, goals/projects, and a durable baseline for AI chat.",
  },
  {
    name: "Pro",
    price: "$24/mo",
    copy: "Unlimited artifacts, premium workflows, notification digests, and priority agent queues.",
  },
];

export default function PricingPage() {
  return (
    <SiteShell>
      <div className="stack">
        <SurfaceCard style={{ padding: 32 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Pricing
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 52,
              marginBottom: 12,
            }}
          >
            Hybrid billing without hybrid confusion.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, maxWidth: 720 }}>
            Stripe handles the web, RevenueCat handles the stores, and Convex
            keeps the entitlement model canonical.
          </p>
        </SurfaceCard>
        <div className="info-grid">
          {tiers.map((tier) => (
            <SurfaceCard key={tier.name} style={{ padding: 24 }}>
              <div style={{ fontSize: 14, textTransform: "uppercase" }}>
                {tier.name}
              </div>
              <div style={{ fontSize: 42, fontWeight: 700, marginTop: 12 }}>
                {tier.price}
              </div>
              <p
                style={{ color: "var(--launch-color-muted)", lineHeight: 1.7 }}
              >
                {tier.copy}
              </p>
              <HeroButton href="/support">Wire checkout hooks</HeroButton>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
