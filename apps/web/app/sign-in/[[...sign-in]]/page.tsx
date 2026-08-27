import { SignIn } from "@clerk/nextjs";
import { productConfig } from "@launch/config/product";
import { SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

export default function SignInPage() {
  // Without a publishable key there is no ClerkProvider in the layout, so
  // rendering <SignIn /> would crash. Show setup guidance instead.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <SiteShell>
        <SurfaceCard className="stack" style={{ padding: 32 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Sign in
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 40,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Sign-in is not configured yet
          </h1>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 17,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {productConfig.name} uses Clerk for authentication. Set
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY (see
            apps/web/.env.example), restart the app, and this page will render
            the real sign-in form.
          </p>
        </SurfaceCard>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "32px 0",
        }}
      >
        <SignIn path="/sign-in" />
      </div>
    </SiteShell>
  );
}
