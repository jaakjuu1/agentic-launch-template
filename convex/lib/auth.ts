import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

const fallbackViewer = {
  clerkUserId: "user_demo",
  email: "june@example.com",
  role: "consumer" as const,
};

export async function getViewerIdentity(
  ctx: QueryCtx | MutationCtx | ActionCtx,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return fallbackViewer;
  }

  return {
    clerkUserId: identity.subject,
    email: identity.email ?? "unknown@example.com",
    role:
      identity.tokenIdentifier.includes("operator") ||
      identity.email?.endsWith("@example.com")
        ? ("operator" as const)
        : ("consumer" as const),
  };
}

export async function getOrCreateViewerProfile(ctx: MutationCtx) {
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

  const now = new Date().toISOString();
  const id = await ctx.db.insert("profiles", {
    analyticsConsent: true,
    clerkUserId: viewer.clerkUserId,
    createdAt: now,
    email: viewer.email,
    firstName: "June",
    locale: "en-US",
    marketingConsent: true,
    role: viewer.role,
    timezone: "Europe/Helsinki",
    updatedAt: now,
  });

  return ctx.db.get(id);
}
