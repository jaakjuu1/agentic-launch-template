import { SiteShell } from "@/components/site-shell";
import { getChangelogEntry } from "@/lib/content";

export default async function ChangelogPage() {
  const entry = await getChangelogEntry();

  return (
    <SiteShell>
      <article className="surface-card" style={{ padding: 32 }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Changelog
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48 }}>
          {entry.data.title}
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.8 }}>{entry.content.trim()}</p>
      </article>
    </SiteShell>
  );
}
