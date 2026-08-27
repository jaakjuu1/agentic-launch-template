import { productConfig } from "@launch/config/product";
import { HeroButton, SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

export default function NotFoundPage() {
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
          404
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 44,
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          That page does not exist
        </h1>
        <p
          style={{
            color: "var(--launch-color-muted)",
            fontSize: 17,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          The link may be outdated, or the page moved. Everything in{" "}
          {productConfig.name} is reachable from the homepage.
        </p>
        <div>
          <HeroButton href="/">Back to the homepage</HeroButton>
        </div>
      </SurfaceCard>
    </SiteShell>
  );
}
