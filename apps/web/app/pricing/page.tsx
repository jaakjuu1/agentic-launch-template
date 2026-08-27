import { productConfig } from "@launch/config/product";
import { HeroButton, SurfaceCard } from "@launch/ui-web";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function PricingPage() {
  const { tiers } = productConfig.pricing;

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
            Plans for {productConfig.name}
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, maxWidth: 720 }}>
            Every tier below comes straight from the product config, so
            repricing or rebranding is a one-file change. Entitlements stay
            canonical in Convex whether a purchase arrives from Stripe on the
            web or the app stores via RevenueCat.
          </p>
        </SurfaceCard>
        <div className="info-grid">
          {tiers.map((tier) => (
            <SurfaceCard
              key={tier.productKey}
              className="stack"
              style={{ padding: 24 }}
            >
              <h2
                style={{
                  fontSize: 14,
                  letterSpacing: "0.14em",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                {tier.name}
              </h2>
              <div style={{ fontSize: 42, fontWeight: 700 }}>
                {tier.displayPrice}
              </div>
              <p
                style={{
                  color: "var(--launch-color-muted)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {tier.description}
              </p>
              <ul
                style={{
                  display: "grid",
                  gap: 8,
                  lineHeight: 1.6,
                  margin: 0,
                  paddingLeft: 20,
                }}
              >
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div>
                <HeroButton href="/sign-in">
                  {tier.tier === "free" ? "Start for free" : `Get ${tier.name}`}
                </HeroButton>
              </div>
            </SurfaceCard>
          ))}
        </div>
        <SurfaceCard className="stack" style={{ padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            Need invoicing, a team plan, or something custom?
          </div>
          <p
            style={{
              color: "var(--launch-color-muted)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            <Link href="/support" style={{ fontWeight: 600 }}>
              Contact support
            </Link>{" "}
            and we will figure out the right setup together.
          </p>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 14,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Honest template note: checkout is not wired up yet. Connecting
            Stripe checkout (and RevenueCat for the stores) is a documented
            launch step — see docs/ROADMAP.md in the repository. Until then
            these buttons route through sign-in.
          </p>
        </SurfaceCard>
      </div>
    </SiteShell>
  );
}
