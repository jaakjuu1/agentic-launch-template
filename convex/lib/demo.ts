import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { nowIso } from "./time";

/**
 * Example records for demo mode so a fresh clone has a populated
 * dashboard. Only called when DEMO_MODE=true (see bootstrap.ts/seed.ts).
 */
export async function ensureDemoRecords(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
) {
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
    description: "Example goal seeded by demo mode.",
    priority: "high",
    profileId,
    status: "active",
    title: "Ship the first release",
    updatedAt: now,
  });

  const projectId = await ctx.db.insert("projects", {
    createdAt: now,
    goalId,
    name: "First launch",
    profileId,
    progressPercent: 40,
    summary: "Example project seeded by demo mode.",
    tags: ["example", "demo"],
    updatedAt: now,
  });

  await ctx.db.insert("artifacts", {
    body: "# Launch brief\n\nExample artifact seeded by demo mode. Ask the assistant to generate a real one.",
    createdAt: now,
    kind: "brief",
    profileId,
    projectId,
    status: "ready",
    title: "Launch brief",
    updatedAt: now,
  });

  await ctx.db.insert("approvals", {
    createdAt: now,
    description:
      "Example approval seeded by demo mode: the agent asked permission before sending an external email.",
    profileId,
    riskLevel: "medium",
    status: "pending",
    title: "Send launch announcement",
    toolRunId: "demo_tool_run",
  });

  await ctx.db.insert("notifications", {
    body: "Demo data seeded. Explore the assistant, projects, and approvals tabs.",
    channel: "in_app",
    createdAt: now,
    profileId,
    title: "Welcome to the demo",
  });
}
