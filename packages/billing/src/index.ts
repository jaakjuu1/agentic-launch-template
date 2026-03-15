import { type Entitlement, entitlementSchema } from "@launch/domain";

export const entitlementRank = {
  free: 0,
  pro: 1,
  lifetime: 2,
} as const;

export type BillingProvider = "stripe" | "revenuecat" | "admin";

export const productCatalog = {
  lifetime: {
    features: ["unlimited_artifacts", "priority_queue", "operator_support"],
    productKey: "lifetime_unlock",
    tier: "lifetime",
  },
  proMonthly: {
    features: ["unlimited_artifacts", "priority_queue"],
    productKey: "pro_monthly",
    tier: "pro",
  },
  free: {
    features: ["basic_chat", "goals_projects"],
    productKey: "free",
    tier: "free",
  },
} as const;

export type ActiveEntitlementSummary = {
  activeTier: keyof typeof entitlementRank;
  entitlements: Entitlement[];
  features: string[];
};

export function mergeEntitlements(raw: readonly Entitlement[]) {
  const entitlements = raw.map((item) => entitlementSchema.parse(item));
  const active = entitlements.filter((item) => item.active);

  if (active.length === 0) {
    return {
      activeTier: "free",
      entitlements,
      features: [...productCatalog.free.features],
    } satisfies ActiveEntitlementSummary;
  }

  const winner = active.reduce((highest, current) =>
    entitlementRank[current.tier] > entitlementRank[highest.tier]
      ? current
      : highest,
  );

  const featureUnion = new Set<string>(productCatalog.free.features);
  for (const entitlement of active) {
    const match = Object.values(productCatalog).find(
      (product) => product.productKey === entitlement.productKey,
    );
    for (const feature of match?.features ?? []) {
      featureUnion.add(feature);
    }
  }

  return {
    activeTier: winner.tier,
    entitlements,
    features: [...featureUnion],
  } satisfies ActiveEntitlementSummary;
}

export function canAccessFeature(
  summary: ActiveEntitlementSummary,
  feature: string,
) {
  return summary.features.includes(feature);
}
