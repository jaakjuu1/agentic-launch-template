import { productConfig } from "@launch/config/product";
import type { Metadata } from "next";

import "./globals.css";

// Fonts load at runtime with a system-font fallback stack (see
// @launch/design-tokens/styles.css) so production builds never depend on
// network access to Google Fonts.
const FONT_STYLESHEET_URL =
  "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=Space+Grotesk:wght@400..700&display=swap";

export const metadata: Metadata = {
  title: productConfig.name,
  description: productConfig.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={FONT_STYLESHEET_URL} />
      </head>
      <body>{children}</body>
    </html>
  );
}
