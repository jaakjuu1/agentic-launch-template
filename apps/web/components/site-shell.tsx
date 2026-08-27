import { productConfig } from "@launch/config/product";
import Link from "next/link";
import type { PropsWithChildren } from "react";

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <div className="page-shell">
      <header className="nav-row">
        <Link href="/" style={{ fontSize: 20, fontWeight: 700 }}>
          {productConfig.name}
        </Link>
        <nav className="nav-links">
          <Link href="/pricing">Pricing</Link>
          <Link href={productConfig.urls.docs}>Docs</Link>
          <Link href="/changelog">Changelog</Link>
          <Link href={productConfig.urls.status}>Status</Link>
          <Link href={productConfig.urls.legal}>Legal</Link>
          <Link href="/support">Support</Link>
          <Link href="/operator">Operator</Link>
        </nav>
      </header>
      <main className="page-section">{children}</main>
      <footer className="footer-row">
        <span>
          © {new Date().getFullYear()} {productConfig.company.legalName}
        </span>
        <a href={`mailto:${productConfig.company.supportEmail}`}>
          {productConfig.company.supportEmail}
        </a>
      </footer>
    </div>
  );
}
