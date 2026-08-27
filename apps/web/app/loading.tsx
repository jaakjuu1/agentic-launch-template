import { productConfig } from "@launch/config/product";
import { SurfaceCard } from "@launch/ui-web";

export default function Loading() {
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
          <div style={{ fontSize: 24, fontWeight: 700 }}>Loading…</div>
        </SurfaceCard>
      </main>
    </div>
  );
}
