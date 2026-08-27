import type { Doc } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { isDemoMode } from "./env";
import { nowIso } from "./time";

export type ViewerRole = "consumer" | "operator" | "admin";

export type ViewerIdentity = {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  /**
   * Role claimed by the Clerk JWT (`app:role` public-metadata claim).
   * Used only when first creating a profile — the profile record is the
   * source of truth afterwards, kept in sync by the Clerk webhook.
   */
  claimedRole: ViewerRole;
};

export const DEMO_CLERK_USER_ID = "user_demo";

const demoViewer: ViewerIdentity = {
  claimedRole: "consumer",
  clerkUserId: DEMO_CLERK_USER_ID,
  email: "demo@example.com",
  firstName: "Demo",
};

export function parseRoleClaim(value: unknown): ViewerRole {
  return value === "operator" || value === "admin" ? value : "consumer";
}

/**
 * Resolve the calling user's identity from the Clerk-issued JWT.
 *
 * Throws for unauthenticated requests unless the deployment explicitly
 * opts into demo mode (DEMO_MODE=true), in which case anonymous callers
 * share a single demo viewer. Never enable demo mode in production.
 */
export async function getViewerIdentity(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<ViewerIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity !== null) {
    const claims = identity as unknown as Record<string, unknown>;
    return {
      claimedRole: parseRoleClaim(claims["app:role"]),
      clerkUserId: identity.subject,
      email: identity.email ?? "",
      firstName: identity.givenName ?? undefined,
      lastName: identity.familyName ?? undefined,
    };
  }

  if (isDemoMode()) {
    return demoViewer;
  }

  throw new Error(
    "Not authenticated. Sign in first, or set DEMO_MODE=true on the Convex deployment to allow the shared demo viewer during local development.",
  );
}

export async function getViewerProfile(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"profiles"> | null> {
  const viewer = await getViewerIdentity(ctx);
  return ctx.db
    .query("profiles")
    .withIndex("by_clerk_user_id", (query) =>
      query.eq("clerkUserId", viewer.clerkUserId),
    )
    .unique();
}

export async function requireViewerProfile(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"profiles">> {
  const profile = await getViewerProfile(ctx);
  if (profile === null) {
    throw new Error(
      "Viewer profile does not exist yet. Call bootstrap.bootstrapViewer after sign-in.",
    );
  }

  return profile;
}

export function deriveFirstName(viewer: {
  email: string;
  firstName?: string;
}): string {
  if (viewer.firstName && viewer.firstName.trim().length > 0) {
    return viewer.firstName.trim().slice(0, 48);
  }

  const localPart = viewer.email.split("@")[0];
  if (localPart && localPart.length > 0) {
    return localPart.slice(0, 48);
  }

  return "Member";
}

export async function getOrCreateViewerProfile(
  ctx: MutationCtx,
): Promise<Doc<"profiles">> {
  const viewer = await getViewerIdentity(ctx);
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_clerk_user_id", (query) =>
      query.eq("clerkUserId", viewer.clerkUserId),
    )
    .unique();

  if (existing) {
    return existing;
  }

  const now = nowIso();
  const id = await ctx.db.insert("profiles", {
    analyticsConsent: false,
    clerkUserId: viewer.clerkUserId,
    createdAt: now,
    email: viewer.email,
    firstName: deriveFirstName(viewer),
    lastName: viewer.lastName,
    locale: "en-US",
    marketingConsent: false,
    role: viewer.claimedRole,
    timezone: "UTC",
    updatedAt: now,
  });

  const profile = await ctx.db.get(id);
  if (profile === null) {
    throw new Error("Failed to create viewer profile");
  }

  return profile;
}

export function isOperatorProfile(profile: Pick<Doc<"profiles">, "role">) {
  return profile.role === "operator" || profile.role === "admin";
}

/**
 * Gate for operator/admin surfaces. Role comes from the profile record —
 * set the `app:role` public-metadata field in Clerk (synced via webhook,
 * or picked up at first sign-in), never from unverified request data.
 */
export async function requireOperatorProfile(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"profiles">> {
  const profile = await requireViewerProfile(ctx);
  if (!isOperatorProfile(profile)) {
    throw new Error("Operator access required");
  }

  return profile;
}
