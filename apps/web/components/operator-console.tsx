import { seedPreview } from "@launch/domain";
import { Stat, SurfaceCard } from "@launch/ui-web";

const operatorFiles = [
  {
    detail: "Project attachment · PDF · private",
    fileName: seedPreview.file.fileName,
    owner: "June",
    size: "47 KB",
    status: "ready",
    target: "project_launch",
  },
  {
    detail: "Artifact export · Markdown · vector indexed",
    fileName: "mobile-launch-brief.md",
    owner: "June",
    size: "9 KB",
    status: "indexed",
    target: "artifact_demo",
  },
  {
    detail: "Support attachment · PNG screenshot",
    fileName: "billing-mismatch.png",
    owner: "June",
    size: "311 KB",
    status: "ready",
    target: "support_request_demo",
  },
] as const;

export function OperatorConsole() {
  return (
    <div className="operator-grid">
      <SurfaceCard className="stack" style={{ padding: 24 }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Operator console
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>
          Approvals, entitlements, thread inspection, and private files.
        </div>
        <div
          style={{
            color: "var(--launch-color-muted)",
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          The template now treats uploads and generated exports as first-class
          records with R2-backed storage, durable attachment links, and
          operator-grade audit visibility.
        </div>
      </SurfaceCard>
      <SurfaceCard className="info-grid" style={{ padding: 24 }}>
        <Stat label="Pending approvals" value="1" />
        <Stat label="Billing mismatches" value="0" />
        <Stat label="Tracked files" value="3" />
        <Stat label="Workflow failures" value="0" />
      </SurfaceCard>
      <SurfaceCard className="stack" style={{ padding: 24 }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          File inspection
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {operatorFiles.map((file) => (
            <div
              key={file.fileName}
              style={{
                border: "1px solid rgba(22, 32, 42, 0.08)",
                borderRadius: 20,
                padding: 18,
              }}
            >
              <div
                style={{
                  alignItems: "start",
                  display: "flex",
                  gap: 16,
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {file.fileName}
                  </div>
                  <div
                    style={{
                      color: "var(--launch-color-muted)",
                      fontSize: 15,
                      lineHeight: 1.6,
                    }}
                  >
                    {file.detail}
                  </div>
                  <div
                    style={{
                      color: "var(--launch-color-muted)",
                      fontSize: 14,
                    }}
                  >
                    Owner: {file.owner} · Target: {file.target} · Size:{" "}
                    {file.size}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(255, 107, 53, 0.12)",
                    borderRadius: 999,
                    color: "#b85c00",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    padding: "7px 11px",
                    textTransform: "uppercase",
                  }}
                >
                  {file.status}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 12,
                }}
              >
                <a href="/support" style={{ fontWeight: 600 }}>
                  Inspect audit trail
                </a>
                <a href="/docs" style={{ fontWeight: 600 }}>
                  Review storage setup
                </a>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
