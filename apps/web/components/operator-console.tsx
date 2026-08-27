"use client";

import { ClerkLoading, Show } from "@clerk/nextjs";
import { productConfig } from "@launch/config/product";
import { api } from "@launch/convex/_generated/api";
import { Eyebrow, HeroButton, Stat, SurfaceCard } from "@launch/ui-web";
import {
  Authenticated,
  AuthLoading,
  useMutation,
  useQuery,
} from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Component, Fragment, type ReactNode, useState } from "react";

type OperatorOverview = FunctionReturnType<typeof api.operator.overview>;
type SupportStatus = "open" | "triaged" | "resolved";

const SUPPORT_STATUSES: SupportStatus[] = ["open", "triaged", "resolved"];

function MutedText({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        color: "var(--launch-color-muted)",
        fontSize: 16,
        lineHeight: 1.7,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

/** Deterministic ISO rendering — avoids locale/timezone hydration drift. */
function formatTimestamp(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

function formatSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  return `${Math.round(sizeBytes / 1024)} KB`;
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function badgeClass(status: string): string {
  if (status === "failed" || status === "cancelled") {
    return "pill-badge pill-badge--danger";
  }
  if (status === "completed" || status === "resolved" || status === "ready") {
    return "pill-badge pill-badge--success";
  }
  if (status === "open" || status === "queued" || status === "running") {
    return "pill-badge pill-badge--accent";
  }
  return "pill-badge pill-badge--neutral";
}

function StatusBadge({ status }: { status: string }) {
  return <span className={badgeClass(status)}>{formatLabel(status)}</span>;
}

function LoadingCard({ label }: { label: string }) {
  return (
    <SurfaceCard className="stack" style={{ padding: 28 }}>
      <Eyebrow>Operator console</Eyebrow>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{label}</div>
      <MutedText>Hold on — fetching live data from Convex.</MutedText>
    </SurfaceCard>
  );
}

function AccessDeniedCard() {
  return (
    <SurfaceCard className="stack" style={{ padding: 28 }}>
      <Eyebrow>Operator console</Eyebrow>
      <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15 }}>
        Signed in, but this account is not an operator
      </div>
      <MutedText>
        The Convex backend rejected the overview query because your profile role
        is not operator or admin. To grant access: open the Clerk dashboard,
        find your user, and add a public metadata entry setting app:role to
        operator (or admin). Make sure your Convex JWT template forwards that
        claim, then sign out and back in so the profile record picks up the new
        role.
      </MutedText>
      <MutedText>
        Roles live on the Convex profile record and sync from Clerk — they are
        never trusted from client-side data, so there is nothing to toggle in
        this UI on purpose.
      </MutedText>
    </SurfaceCard>
  );
}

function QueryErrorCard({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  if (error.message.includes("Operator access required")) {
    return <AccessDeniedCard />;
  }

  return (
    <SurfaceCard className="stack" style={{ padding: 28 }}>
      <Eyebrow>Operator console</Eyebrow>
      <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15 }}>
        The overview query failed
      </div>
      <MutedText>{error.message}</MutedText>
      <div>
        <button className="console-action" onClick={onRetry} type="button">
          Try again
        </button>
      </div>
    </SurfaceCard>
  );
}

type BoundaryState = { attempt: number; error: Error | null };

/**
 * Convex's useQuery throws query errors during render, so the
 * loading/denied/data state machine needs a boundary. Retrying remounts
 * the subtree, which restarts the query subscription.
 */
class ConsoleErrorBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  override state: BoundaryState = { attempt: 0, error: null };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <QueryErrorCard
          error={this.state.error}
          onRetry={() =>
            this.setState((previous) => ({
              attempt: previous.attempt + 1,
              error: null,
            }))
          }
        />
      );
    }

    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}

function SupportQueue({
  supportQueue,
}: {
  supportQueue: OperatorOverview["supportQueue"];
}) {
  const updateStatus = useMutation(api.operator.updateSupportRequestStatus);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusChange = async (
    supportRequestId: OperatorOverview["supportQueue"][number]["_id"],
    status: SupportStatus,
  ) => {
    const actionKey = `${supportRequestId}:${status}`;
    setPendingAction(actionKey);
    setActionError(null);
    try {
      await updateStatus({ status, supportRequestId });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Status update failed.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <SurfaceCard className="stack" style={{ padding: 24 }}>
      <Eyebrow>Support queue</Eyebrow>
      {actionError ? (
        <div
          role="alert"
          style={{ color: "#b82020", fontSize: 15, lineHeight: 1.6 }}
        >
          {actionError}
        </div>
      ) : null}
      {supportQueue.length === 0 ? (
        <MutedText>No support requests yet — the queue is clear.</MutedText>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {supportQueue.map((request) => (
            <div className="row-item" key={request._id}>
              <div className="row-item-head">
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>
                    {request.subject}
                  </div>
                  <div
                    style={{ color: "var(--launch-color-muted)", fontSize: 14 }}
                  >
                    Opened {formatTimestamp(request.createdAt)}
                  </div>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {SUPPORT_STATUSES.filter(
                  (status) => status !== request.status,
                ).map((status) => (
                  <button
                    className="console-action"
                    disabled={pendingAction !== null}
                    key={status}
                    onClick={() => handleStatusChange(request._id, status)}
                    type="button"
                  >
                    {pendingAction === `${request._id}:${status}`
                      ? "Saving…"
                      : `Mark ${status}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

function RecentFiles({
  recentFiles,
}: {
  recentFiles: OperatorOverview["recentFiles"];
}) {
  return (
    <SurfaceCard className="stack" style={{ padding: 24 }}>
      <Eyebrow>Recent files</Eyebrow>
      {recentFiles.length === 0 ? (
        <MutedText>No tracked files yet.</MutedText>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              fontSize: 15,
              minWidth: 640,
              textAlign: "left",
              width: "100%",
            }}
          >
            <thead>
              <tr
                style={{
                  color: "var(--launch-color-muted)",
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                <th style={{ padding: "8px 12px 8px 0" }}>File</th>
                <th style={{ padding: "8px 12px 8px 0" }}>Purpose</th>
                <th style={{ padding: "8px 12px 8px 0" }}>Type</th>
                <th style={{ padding: "8px 12px 8px 0" }}>Size</th>
                <th style={{ padding: "8px 12px 8px 0" }}>Created</th>
                <th style={{ padding: "8px 0" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map((file) => (
                <tr
                  key={file._id}
                  style={{ borderTop: "1px solid rgba(22, 32, 42, 0.08)" }}
                >
                  <td style={{ fontWeight: 600, padding: "10px 12px 10px 0" }}>
                    {file.fileName}
                  </td>
                  <td style={{ padding: "10px 12px 10px 0" }}>
                    {formatLabel(file.purpose)}
                  </td>
                  <td style={{ padding: "10px 12px 10px 0" }}>
                    {file.mimeType}
                  </td>
                  <td style={{ padding: "10px 12px 10px 0" }}>
                    {formatSize(file.sizeBytes)}
                  </td>
                  <td style={{ padding: "10px 12px 10px 0" }}>
                    {formatTimestamp(file.createdAt)}
                  </td>
                  <td style={{ padding: "10px 0" }}>
                    <StatusBadge status={file.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SurfaceCard>
  );
}

function RecentWorkflows({
  recentWorkflows,
}: {
  recentWorkflows: OperatorOverview["recentWorkflows"];
}) {
  return (
    <SurfaceCard className="stack" style={{ padding: 24 }}>
      <Eyebrow>Recent workflow runs</Eyebrow>
      {recentWorkflows.length === 0 ? (
        <MutedText>No workflow runs recorded yet.</MutedText>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {recentWorkflows.map((run) => (
            <div className="row-item" key={run._id}>
              <div className="row-item-head">
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>
                    {formatLabel(run.kind)}
                  </div>
                  <div
                    style={{ color: "var(--launch-color-muted)", fontSize: 14 }}
                  >
                    Started {formatTimestamp(run.createdAt)}
                  </div>
                </div>
                <StatusBadge status={run.status} />
              </div>
              {run.lastError ? (
                <div
                  style={{
                    color: "#b82020",
                    fontSize: 14,
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                  }}
                >
                  Last error: {run.lastError}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

function OperatorData() {
  const overview = useQuery(api.operator.overview);

  if (overview === undefined) {
    return <LoadingCard label="Loading the overview…" />;
  }

  return (
    <div className="stack">
      <div className="operator-grid">
        <SurfaceCard className="stack" style={{ padding: 24 }}>
          <Eyebrow>Operator console</Eyebrow>
          <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>
            Live view of {productConfig.name}
          </div>
          <MutedText>
            Counts, support triage, file records, and workflow runs stream
            straight from the Convex deployment. Everything here is gated on the
            operator role server-side.
          </MutedText>
        </SurfaceCard>
        <SurfaceCard className="info-grid" style={{ padding: 24 }}>
          <Stat label="Profiles" value={String(overview.counts.profiles)} />
          <Stat
            label="Open support requests"
            value={String(overview.counts.openSupportRequests)}
          />
          <Stat
            label="Pending approvals"
            value={String(overview.counts.pendingApprovals)}
          />
          <Stat
            label="Failed workflows"
            value={String(overview.counts.failedWorkflows)}
          />
        </SurfaceCard>
      </div>
      <SupportQueue supportQueue={overview.supportQueue} />
      <RecentFiles recentFiles={overview.recentFiles} />
      <RecentWorkflows recentWorkflows={overview.recentWorkflows} />
    </div>
  );
}

function SignedOutCard() {
  return (
    <SurfaceCard className="stack" style={{ padding: 28 }}>
      <Eyebrow>Operator console</Eyebrow>
      <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15 }}>
        Sign in to operate {productConfig.name}
      </div>
      <MutedText>
        This console shows live customer data, so it sits behind Clerk
        authentication and a server-enforced operator role.
      </MutedText>
      <div>
        <HeroButton href="/sign-in">Sign in</HeroButton>
      </div>
    </SurfaceCard>
  );
}

export function OperatorConsole() {
  // Clerk v7 replaced <SignedIn>/<SignedOut> with <Show when=...>; the
  // signed-out branch links to /sign-in, and Convex's Authenticated gate
  // keeps the query from firing before the Clerk JWT reaches Convex.
  return (
    <>
      <ClerkLoading>
        <LoadingCard label="Checking your session…" />
      </ClerkLoading>
      <Show when="signed-out">
        <SignedOutCard />
      </Show>
      <Show when="signed-in">
        <AuthLoading>
          <LoadingCard label="Connecting to Convex…" />
        </AuthLoading>
        <Authenticated>
          <ConsoleErrorBoundary>
            <OperatorData />
          </ConsoleErrorBoundary>
        </Authenticated>
      </Show>
    </>
  );
}
