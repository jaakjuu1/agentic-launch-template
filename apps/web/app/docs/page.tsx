import { MDXRemote } from "next-mdx-remote/rsc";

import { SiteShell } from "@/components/site-shell";
import { getDocsContent } from "@/lib/content";

export default async function DocsPage() {
  const docs = await getDocsContent();

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
          {docs.data.eyebrow}
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48 }}>
          {docs.data.title}
        </h1>
        <div style={{ fontSize: 18, lineHeight: 1.85 }}>
          <MDXRemote source={docs.content} />
        </div>
      </article>
    </SiteShell>
  );
}
