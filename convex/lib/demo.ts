import type { MutationCtx } from "../_generated/server";
import { nowIso } from "./time";

export async function ensureDemoRecords(ctx: MutationCtx, profileId: string) {
  const existingGoal = await ctx.db
    .query("goals")
    .withIndex("by_profile", (query) => query.eq("profileId", profileId))
    .first();

  if (existingGoal) {
    return;
  }

  const now = nowIso();
  const goalId = await ctx.db.insert("goals", {
    createdAt: now,
    description: "Launch the reference app with durable AI workflows.",
    priority: "high",
    profileId,
    status: "active",
    title: "Ship the launch template",
    updatedAt: now,
  });

  await ctx.db.insert("projects", {
    createdAt: now,
    goalId,
    name: "Template hardening",
    profileId,
    progressPercent: 72,
    summary: "Finish launch surfaces, integrations, and operator flows.",
    tags: ["launch", "agentic", "billing"],
    updatedAt: now,
  });

  await ctx.db.insert("notifications", {
    body: "Your launch brief is ready for review.",
    channel: "in_app",
    createdAt: now,
    profileId,
    title: "Artifact ready",
  });
}
