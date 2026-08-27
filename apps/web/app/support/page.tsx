import { productConfig } from "@launch/config/product";
import { SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

export default function SupportPage() {
  const { supportEmail } = productConfig.company;

  return (
    <SiteShell>
      <div className="stack">
        <SurfaceCard className="stack" style={{ padding: 32 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Support
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 48,
              margin: 0,
            }}
          >
            Get help with {productConfig.name}
          </h1>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 18,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Email us anytime at{" "}
            <a href={`mailto:${supportEmail}`} style={{ fontWeight: 600 }}>
              {supportEmail}
            </a>
            . Include the account email you signed up with so we can find your
            records quickly.
          </p>
        </SurfaceCard>
        <SurfaceCard className="stack" style={{ padding: 28 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            How in-app support works
          </div>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 16,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Support is a product feature here, not an afterthought. Requests
            submitted inside the app are stored as first-class records in the
            Convex backend, acknowledged by email, and land in an operator queue
            where a human triages them from open to triaged to resolved. Billing
            or account incidents can be escalated with full context —
            attachments included — instead of getting lost in an inbox.
          </p>
        </SurfaceCard>
      </div>
    </SiteShell>
  );
}
