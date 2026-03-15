import { clsx } from "clsx";
import type { CSSProperties, PropsWithChildren } from "react";

const cardStyle: CSSProperties = {
  background: "var(--launch-color-card)",
  border: "1px solid rgba(22, 32, 42, 0.08)",
  borderRadius: "var(--launch-radius-lg)",
  boxShadow: "var(--launch-shadow-card)",
};

export function SurfaceCard({
  children,
  className,
  style,
}: PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  return (
    <div
      className={clsx("launch-surface-card", className)}
      style={{ ...cardStyle, ...style }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        color: "var(--launch-color-muted)",
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

export function HeroButton({
  children,
  href,
  tone = "primary",
}: PropsWithChildren<{ href: string; tone?: "primary" | "secondary" }>) {
  return (
    <a
      href={href}
      style={{
        alignItems: "center",
        background:
          tone === "primary" ? "var(--launch-color-ink)" : "transparent",
        border:
          tone === "primary"
            ? "1px solid transparent"
            : "1px solid rgba(22, 32, 42, 0.14)",
        borderRadius: "var(--launch-radius-pill)",
        color:
          tone === "primary"
            ? "var(--launch-color-surface)"
            : "var(--launch-color-ink)",
        display: "inline-flex",
        gap: 8,
        padding: "14px 20px",
      }}
    >
      {children}
    </a>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          color: "var(--launch-color-muted)",
          fontSize: 12,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
