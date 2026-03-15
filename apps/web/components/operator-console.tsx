"use client";

import { Stat, SurfaceCard } from "@launch/ui-web";

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
          Approvals, entitlements, and thread inspection.
        </div>
        <div
          style={{
            color: "var(--launch-color-muted)",
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          The reference admin surface centralizes risky approvals, support
          escalations, billing reconciliation, and AI audit trails without
          polluting the consumer UI.
        </div>
      </SurfaceCard>
      <SurfaceCard className="info-grid" style={{ padding: 24 }}>
        <Stat label="Pending approvals" value="1" />
        <Stat label="Billing mismatches" value="0" />
        <Stat label="Open support requests" value="4" />
        <Stat label="Workflow failures" value="0" />
      </SurfaceCard>
    </div>
  );
}
