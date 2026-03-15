import { SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

export default function SupportPage() {
  return (
    <SiteShell>
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
          style={{ fontFamily: "var(--font-display)", fontSize: 48, margin: 0 }}
        >
          Support flows are product features, not afterthoughts.
        </h1>
        <p
          style={{
            color: "var(--launch-color-muted)",
            fontSize: 18,
            lineHeight: 1.8,
          }}
        >
          The template includes support request records, email acknowledgements,
          escalation hooks, and operator review paths so billing and account
          incidents have a real home.
        </p>
      </SurfaceCard>
    </SiteShell>
  );
}
