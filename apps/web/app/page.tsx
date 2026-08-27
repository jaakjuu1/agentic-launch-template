import { HeroButton, Stat, SurfaceCard } from "@launch/ui-web";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { getMarketingData } from "@/lib/content";

export default async function HomePage() {
  const { hero, latestChangelog, productPillars, statBlocks } =
    await getMarketingData();

  return (
    <SiteShell>
      <div className="hero-grid">
        <section className="surface-card" style={{ padding: 32 }}>
          <div
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {hero.name}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              lineHeight: 1.02,
              marginBottom: 16,
              marginTop: 18,
            }}
          >
            {hero.tagline}
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, maxWidth: 720 }}>
            {hero.description}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 24,
            }}
          >
            <HeroButton href={hero.docsUrl}>Read setup docs</HeroButton>
            <HeroButton href="/operator" tone="secondary">
              Explore operator console
            </HeroButton>
          </div>
        </section>
        <SurfaceCard className="stack" style={{ padding: 24 }}>
          <div className="info-grid">
            {statBlocks.map((item) => (
              <Stat key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(22, 32, 42, 0.08)",
              paddingTop: 18,
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Latest change
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
              {latestChangelog.data.title}
            </div>
            <p style={{ color: "var(--launch-color-muted)", lineHeight: 1.7 }}>
              {latestChangelog.content.trim()}
            </p>
            <Link href="/changelog" style={{ fontWeight: 600 }}>
              View changelog
            </Link>
          </div>
        </SurfaceCard>
      </div>

      <section className="page-section stack">
        {productPillars.map((pillar) => (
          <SurfaceCard key={pillar} style={{ padding: 22 }}>
            <div style={{ fontSize: 20, lineHeight: 1.6 }}>{pillar}</div>
          </SurfaceCard>
        ))}
      </section>
    </SiteShell>
  );
}
