import { productConfig } from "@launch/config/product";
import { SurfaceCard } from "@launch/ui-web";

import { SiteShell } from "@/components/site-shell";

export default function LegalPage() {
  const { legalName, supportEmail } = productConfig.company;

  // Placeholder legal copy parameterized by the product config. These are
  // TEMPLATES: have counsel produce real terms, privacy policy, and any
  // region-specific notices before launch.
  const sections = [
    {
      title: "Terms of Service (template)",
      body: `${productConfig.name} is operated by ${legalName}. By creating an account you agree to use the service lawfully and accept that ${legalName} may suspend accounts that abuse the platform. Replace this placeholder with terms reviewed by your counsel before launch.`,
    },
    {
      title: "Privacy Policy (template)",
      body: `${legalName} stores the account details, content, and support requests you submit in order to provide the service. Analytics and marketing consent are opt-in, and you can request export or deletion of your data by contacting ${supportEmail}. Replace this placeholder with a full policy covering your actual processors, retention windows, and regional disclosures (GDPR, CCPA, and similar).`,
    },
    {
      title: "Subprocessors and data handling (template)",
      body: `The template stack processes data through Clerk (authentication), Convex (application data), Cloudflare R2 (file storage), Stripe and RevenueCat (billing), and an AI model provider for assistant features. Before launch, ${legalName} should publish a current subprocessor list and sign data processing agreements where required.`,
    },
  ];

  return (
    <SiteShell>
      <section className="stack">
        <SurfaceCard className="stack" style={{ padding: 28 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Legal
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 48,
              lineHeight: 1,
              margin: 0,
            }}
          >
            Legal templates for {legalName}
          </h1>
          <p
            style={{
              color: "var(--launch-color-muted)",
              fontSize: 18,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Everything on this page is placeholder text generated from the
            product config — it is not legal advice and has not been reviewed by
            a lawyer. Swap in your real terms, privacy policy, DPA references,
            and region-specific notices before shipping.
          </p>
        </SurfaceCard>
        {sections.map((section) => (
          <SurfaceCard
            key={section.title}
            className="stack"
            style={{ padding: 24 }}
          >
            <div style={{ fontSize: 28, fontWeight: 700 }}>{section.title}</div>
            <div
              style={{ color: "var(--launch-color-muted)", lineHeight: 1.7 }}
            >
              {section.body}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </SiteShell>
  );
}
