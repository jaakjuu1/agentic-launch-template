import { productConfig } from "@launch/config/product";
import { SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

// This template cannot observe your deployment, so this page makes no
// uptime claims. It documents what the stack consists of and links to the
// real status pages of each provider. Replace it with a live status
// provider (or your own monitors) before launch.
const stackComponents = [
  {
    name: "Web + operator surface",
    role: "Next.js app for marketing pages and the operator console.",
    provider: "Vercel status",
    statusUrl: "https://www.vercel-status.com",
  },
  {
    name: "Backend and workflows",
    role: "Convex powers reactive queries, durable workflows, and approvals.",
    provider: "Convex status",
    statusUrl: "https://status.convex.dev",
  },
  {
    name: "Authentication",
    role: "Clerk handles sign-in, sessions, and the operator role claim.",
    provider: "Clerk status",
    statusUrl: "https://status.clerk.com",
  },
  {
    name: "Billing",
    role: "Stripe (web) and RevenueCat (stores) feed the entitlement model.",
    provider: "Stripe status",
    statusUrl: "https://status.stripe.com",
  },
  {
    name: "File storage",
    role: "Cloudflare R2 stores uploads and generated artifacts privately.",
    provider: "Cloudflare status",
    statusUrl: "https://www.cloudflarestatus.com",
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
              margin: 0,
            }}
          >
            What {productConfig.name} runs on
          </h1>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 18,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            This page does not report live health — the template has no monitors
            wired in, and pretending otherwise would be dishonest. Instead, here
            is the stack this deployment depends on, with links to each
            provider&apos;s real status page. Before launch, replace this page
            with a hosted status provider or your own uptime checks.
          </p>
        </SurfaceCard>
        {stackComponents.map((component) => (
          <SurfaceCard
            key={component.name}
            className="stack"
            style={{ padding: 24 }}
          >
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {component.name}
            </div>
            <div
              style={{ color: "var(--launch-color-muted)", lineHeight: 1.7 }}
            >
              {component.role}
            </div>
            <a
              href={component.statusUrl}
              rel="noreferrer"
              style={{ fontWeight: 600 }}
              target="_blank"
            >
              {component.provider} ↗
            </a>
          </SurfaceCard>
        ))}
      </section>
    </SiteShell>
  );
}
