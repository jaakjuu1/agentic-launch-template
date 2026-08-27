"use client";

import { productConfig } from "@launch/config/product";
import { SurfaceCard } from "@launch/ui-web";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-shell">
      <main className="page-section">
        <SurfaceCard className="stack" style={{ padding: 32 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {productConfig.name}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 44,
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 17,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            The page hit an unexpected error. You can retry, or head back to the
            homepage.
            {error.digest ? ` Error digest: ${error.digest}.` : ""}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button className="console-action" onClick={reset} type="button">
              Try again
            </button>
            <a className="console-action" href="/">
              Go home
            </a>
          </div>
        </SurfaceCard>
      </main>
    </div>
  );
}
