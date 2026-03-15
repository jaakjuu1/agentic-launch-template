import { SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

const sections = [
  {
    title: "Privacy posture",
    body: "Analytics, push, billing, and AI features are designed to remain auditable. Sensitive actions are approval-gated and user data export or deletion flows stay explicit.",
  },
  {
    title: "Store compliance",
    body: "The template includes restore-purchase surfaces, permission copy, support entry points, and legal placeholders so mobile launches do not stall on avoidable review issues.",
  },
  {
    title: "Operator controls",
    body: "Admin access is separated from consumer roles, and risky actions are routed through explicit backend tool boundaries instead of prompt-only behavior.",
  },
];

export default function LegalPage() {
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
            Legal
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 48,
              lineHeight: 1,
            }}
          >
            Replace the placeholders before launch.
          </h1>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 18,
              lineHeight: 1.7,
            }}
          >
            This page is intentionally product-ready but generic. Swap in your
            privacy policy, terms, DPA references, and region-specific notices
            before shipping.
          </p>
        </SurfaceCard>
        {sections.map((section) => (
          <SurfaceCard
            key={section.title}
            className="stack"
            style={{ padding: 24 }}
          >
            <div style={{ fontSize: 28, fontWeight: 700 }}>{section.title}</div>
            <div
              style={{ color: "var(--launch-color-muted)", lineHeight: 1.7 }}
            >
              {section.body}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </SiteShell>
  );
}
