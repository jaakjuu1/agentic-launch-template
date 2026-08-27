import { ClerkProvider } from "@clerk/nextjs";
import { productConfig } from "@launch/config/product";
import type { Metadata } from "next";
import type { ReactNode } from "react";

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

// The app must build and run with no env vars set (fresh template clones,
// CI smoke builds). ClerkProvider throws without a publishable key, so we
// only mount it when the key exists; the rest of the tree is Clerk-free
// until then.
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({ children }: { children: ReactNode }) {
  const shell = (
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

  if (!clerkPublishableKey) {
    return shell;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} signInUrl="/sign-in">
      {shell}
    </ClerkProvider>
  );
}
