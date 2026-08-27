/**
 * Single source of truth for product identity.
 *
 * When cloning this template into a new product, edit THIS FILE (or run
 * `pnpm new-product`, which edits it for you) instead of hunting for
 * hardcoded strings. Apps, the Convex backend, and the Expo config all
 * read from here.
 *
 * Only static, public values belong in this file — secrets and
 * environment-specific URLs stay in env vars (see the env schemas in
 * `./index.ts`).
 */

export interface PricingTierConfig {
  /** Stable identifier stored on entitlement records. */
  productKey: string;
  tier: "free" | "pro" | "lifetime";
  name: string;
  description: string;
  /** Display price, e.g. "9,99 €/kk". Billing sources stay authoritative. */
  displayPrice: string;
  features: string[];
  /** RevenueCat entitlement identifier that maps to this tier (mobile). */
  revenuecatEntitlementId?: string;
  /** Env var name holding the Stripe price id for this tier (web). */
  stripePriceIdEnvVar?: string;
}

export interface ProductConfig {
  /** Human-readable product name shown in UI, app stores, and metadata. */
  name: string;
  /** URL/package-safe identifier: lowercase, digits, dashes. */
  slug: string;
  tagline: string;
  description: string;
  company: {
    legalName: string;
    supportEmail: string;
  };
  urls: {
    /** Public marketing site. */
    marketing: string;
    /** Docs base path or absolute URL. */
    docs: string;
    status: string;
    legal: string;
  };
  mobile: {
    /** Deep-link scheme, e.g. "agentic-launch". */
    scheme: string;
    iosBundleId: string;
    androidPackage: string;
    /** EAS project id — set after `eas init`. */
    easProjectId: string;
  };
  branding: {
    /** Hex color used for adaptive icons and accents outside the token system. */
    primaryColor: string;
    backgroundColor: string;
  };
  pricing: {
    tiers: PricingTierConfig[];
  };
  agent: {
    /** Internal agent name (stable id for threads/telemetry). */
    name: string;
    /** Name the assistant uses for itself in conversation. */
    displayName: string;
    /**
     * System instructions for the product's primary agent. Rewrite these
     * for every new product — this is the agent's personality and job
     * description.
     */
    instructions: string;
    /**
     * Default model id, overridable at runtime with the AI_MODEL env var.
     * Uses the Vercel AI SDK OpenAI provider by default; see
     * packages/ai/README notes in docs/architecture.md for swapping
     * providers.
     */
    defaultModel: string;
  };
}

export const productConfig: ProductConfig = {
  name: "Agentic Launch",
  slug: "agentic-launch",
  tagline: "Expo + Next.js + Convex starter for agent-ready consumer products.",
  description:
    "An AI productivity companion that turns goals into projects, generates artifacts with durable agent workflows, and keeps humans in the loop with approvals.",
  company: {
    legalName: "Example Labs",
    supportEmail: "support@example.com",
  },
  urls: {
    marketing: "https://example.com",
    docs: "/docs",
    status: "/status",
    legal: "/legal",
  },
  mobile: {
    scheme: "agentic-launch",
    iosBundleId: "com.example.agenticlaunch",
    androidPackage: "com.example.agenticlaunch",
    easProjectId: "replace-in-eas",
  },
  branding: {
    primaryColor: "#ff6b35",
    backgroundColor: "#f5efe6",
  },
  pricing: {
    tiers: [
      {
        productKey: "free",
        tier: "free",
        name: "Free",
        description: "Try the assistant and keep up to three active projects.",
        displayPrice: "0 €",
        features: [
          "Durable assistant threads",
          "3 active projects",
          "Community support",
        ],
      },
      {
        productKey: "pro_monthly",
        tier: "pro",
        name: "Pro",
        description: "Unlimited projects, workflows, and artifact exports.",
        displayPrice: "9,99 €/month",
        features: [
          "Unlimited projects and goals",
          "Background agent workflows",
          "File uploads and artifact exports",
          "Priority support",
        ],
        revenuecatEntitlementId: "pro",
        stripePriceIdEnvVar: "STRIPE_PRICE_ID_PRO_MONTHLY",
      },
    ],
  },
  agent: {
    name: "productivity_companion",
    displayName: "Companion",
    instructions:
      "You are the durable productivity companion for this product. Help users turn goals into concrete projects and artifacts, queue background workflows when work should continue without the user waiting, and route risky or irreversible actions into approval requests instead of executing them directly. Be concise and concrete.",
    defaultModel: "gpt-5-mini",
  },
};

/** Look up a pricing tier by its stable product key. */
export function getTierByProductKey(
  productKey: string,
): PricingTierConfig | undefined {
  return productConfig.pricing.tiers.find(
    (tier) => tier.productKey === productKey,
  );
}

/** Map a RevenueCat entitlement id to the matching pricing tier. */
export function getTierByRevenuecatEntitlement(
  entitlementId: string,
): PricingTierConfig | undefined {
  return productConfig.pricing.tiers.find(
    (tier) => tier.revenuecatEntitlementId === entitlementId,
  );
}
