import Link from "next/link";
import type { PropsWithChildren } from "react";

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <div className="page-shell">
      <header className="nav-row">
        <Link href="/" style={{ fontSize: 20, fontWeight: 700 }}>
          Agentic Launch
        </Link>
        <nav className="nav-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/changelog">Changelog</Link>
          <a href="/status">Status</a>
          <a href="/legal">Legal</a>
          <Link href="/support">Support</Link>
          <Link href="/operator">Operator</Link>
        </nav>
      </header>
      <main className="page-section">{children}</main>
    </div>
  );
}
