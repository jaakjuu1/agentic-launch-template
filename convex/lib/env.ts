/**
 * Deployment environment helpers for the Convex backend.
 *
 * Keep this module dependency-free: `schema.ts` imports the embedding
 * dimensions from here, so it must not pull in providers or workspace
 * packages.
 */

/**
 * Vector index dimensions. Coupled to the embedding model below — if you
 * change AI_EMBEDDING_MODEL to a model with a different output size, update
 * this constant (the vector indexes in schema.ts read it) and re-embed
 * existing content.
 */
export const EMBEDDING_DIMENSIONS = 1536;

export const DEFAULT_EMBEDDING_MODEL_ID = "text-embedding-3-small";

/**
 * Demo mode relaxes authentication so the template runs end-to-end without
 * Clerk configured: unauthenticated requests act as a shared demo viewer,
 * demo records are seeded, and the preview entitlement mutation is enabled.
 *
 * NEVER enable this on a production deployment. It is opt-in via
 * `npx convex env set DEMO_MODE true` and defaults to off.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function resolveEmbeddingModelId(): string {
  return process.env.AI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL_ID;
}

export function getClerkWebhookSecret(): string | undefined {
  return process.env.CLERK_WEBHOOK_SECRET;
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET;
}

/**
 * Shared secret compared against the Authorization header RevenueCat sends
 * with webhook requests (configured in the RevenueCat dashboard).
 */
export function getRevenuecatWebhookAuthToken(): string | undefined {
  return process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
}

export function getResendWebhookSecret(): string | undefined {
  return process.env.RESEND_WEBHOOK_SECRET;
}
