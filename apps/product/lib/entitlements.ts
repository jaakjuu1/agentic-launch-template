export type EntitlementTier = "free" | "pro" | "lifetime";

const tierRank: Record<EntitlementTier, number> = {
  free: 0,
  lifetime: 2,
  pro: 1,
};

/**
 * Resolve the highest active tier from entitlement records. Works for
 * both live Convex docs and the offline fixtures — only `active` and
 * `tier` are inspected.
 */
export function resolveActiveTier(
  entitlements: ReadonlyArray<{ active: boolean; tier: EntitlementTier }>,
): EntitlementTier {
  return entitlements.reduce<EntitlementTier>(
    (highest, entitlement) =>
      entitlement.active && tierRank[entitlement.tier] > tierRank[highest]
        ? entitlement.tier
        : highest,
    "free",
  );
}
