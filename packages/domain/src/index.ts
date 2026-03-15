import { z } from "zod";

export const isoDateString = z.string().datetime({ offset: true });
export const entityId = z.string().min(3);

export const roleSchema = z.enum(["consumer", "operator", "admin"]);
export type Role = z.infer<typeof roleSchema>;

export const goalStatusSchema = z.enum(["draft", "active", "paused", "done"]);
export const artifactStatusSchema = z.enum([
  "queued",
  "processing",
  "ready",
  "failed",
]);
export const agentMessageRoleSchema = z.enum([
  "system",
  "user",
  "assistant",
  "tool",
]);
export const toolRunStatusSchema = z.enum([
  "queued",
  "running",
  "requires_approval",
  "completed",
  "failed",
]);
export const approvalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
]);
export const workflowStatusSchema = z.enum([
  "queued",
  "running",
  "awaiting_input",
  "completed",
  "failed",
  "cancelled",
]);
export const notificationChannelSchema = z.enum(["in_app", "push", "email"]);
export const entitlementSourceSchema = z.enum([
  "stripe",
  "revenuecat",
  "admin",
]);
export const entitlementTierSchema = z.enum(["free", "pro", "lifetime"]);
export const supportStatusSchema = z.enum(["open", "triaged", "resolved"]);

export const profileSchema = z.object({
  id: entityId,
  clerkUserId: entityId,
  role: roleSchema.default("consumer"),
  firstName: z.string().min(1),
  lastName: z.string().min(1).optional(),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().default("UTC"),
  locale: z.string().default("en-US"),
  marketingConsent: z.boolean().default(false),
  analyticsConsent: z.boolean().default(false),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type Profile = z.infer<typeof profileSchema>;

export const goalSchema = z.object({
  id: entityId,
  profileId: entityId,
  title: z.string().min(3).max(120),
  description: z.string().max(1200).default(""),
  status: goalStatusSchema.default("draft"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueAt: isoDateString.optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type Goal = z.infer<typeof goalSchema>;

export const projectSchema = z.object({
  id: entityId,
  profileId: entityId,
  goalId: entityId.optional(),
  name: z.string().min(3).max(120),
  summary: z.string().max(1200).default(""),
  tags: z.array(z.string().min(1)).default([]),
  progressPercent: z.number().int().min(0).max(100).default(0),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type Project = z.infer<typeof projectSchema>;

export const artifactSchema = z.object({
  id: entityId,
  profileId: entityId,
  projectId: entityId.optional(),
  workflowRunId: entityId.optional(),
  title: z.string().min(3),
  kind: z.enum(["plan", "brief", "draft", "image", "report"]),
  status: artifactStatusSchema.default("queued"),
  body: z.string().default(""),
  storageUrl: z.string().url().optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type Artifact = z.infer<typeof artifactSchema>;

export const agentThreadSchema = z.object({
  id: entityId,
  profileId: entityId,
  projectId: entityId.optional(),
  title: z.string().min(3).max(120),
  summary: z.string().max(1000).default(""),
  model: z.string().min(2),
  provider: z.enum(["openai", "anthropic", "google", "mock"]).default("openai"),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type AgentThread = z.infer<typeof agentThreadSchema>;

export const agentMessageSchema = z.object({
  id: entityId,
  threadId: entityId,
  role: agentMessageRoleSchema,
  content: z.string().min(1),
  toolName: z.string().optional(),
  toolRunId: entityId.optional(),
  createdAt: isoDateString,
});
export type AgentMessage = z.infer<typeof agentMessageSchema>;

export const toolRunSchema = z.object({
  id: entityId,
  threadId: entityId,
  workflowRunId: entityId.optional(),
  toolName: z.string().min(2),
  description: z.string().max(240),
  status: toolRunStatusSchema.default("queued"),
  args: z.record(z.string(), z.unknown()).default({}),
  result: z.record(z.string(), z.unknown()).optional(),
  approvalId: entityId.optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type ToolRun = z.infer<typeof toolRunSchema>;

export const approvalSchema = z.object({
  id: entityId,
  profileId: entityId,
  toolRunId: entityId,
  title: z.string().min(3),
  description: z.string().max(400),
  riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
  status: approvalStatusSchema.default("pending"),
  decidedBy: entityId.optional(),
  decidedAt: isoDateString.optional(),
  createdAt: isoDateString,
});
export type Approval = z.infer<typeof approvalSchema>;

export const workflowRunSchema = z.object({
  id: entityId,
  profileId: entityId,
  projectId: entityId.optional(),
  threadId: entityId.optional(),
  kind: z.enum([
    "artifact_generation",
    "weekly_digest",
    "support_follow_up",
    "billing_sync",
  ]),
  status: workflowStatusSchema.default("queued"),
  trigger: z.enum(["user", "schedule", "webhook", "operator"]).default("user"),
  lastError: z.string().optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type WorkflowRun = z.infer<typeof workflowRunSchema>;

export const notificationSchema = z.object({
  id: entityId,
  profileId: entityId,
  channel: notificationChannelSchema,
  title: z.string().min(3),
  body: z.string().min(1).max(280),
  readAt: isoDateString.optional(),
  sentAt: isoDateString.optional(),
  deepLink: z.string().optional(),
  createdAt: isoDateString,
});
export type Notification = z.infer<typeof notificationSchema>;

export const entitlementSchema = z.object({
  id: entityId,
  profileId: entityId,
  source: entitlementSourceSchema,
  tier: entitlementTierSchema.default("free"),
  productKey: z.string().min(2),
  active: z.boolean(),
  renewsAt: isoDateString.optional(),
  expiresAt: isoDateString.optional(),
  originalTransactionId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type Entitlement = z.infer<typeof entitlementSchema>;

export const analyticsEventNameSchema = z.enum([
  "app_opened",
  "goal_created",
  "project_created",
  "artifact_requested",
  "artifact_ready",
  "paywall_viewed",
  "checkout_started",
  "entitlement_activated",
  "approval_requested",
  "approval_decided",
  "notification_opened",
  "support_requested",
]);

export const analyticsEventSchema = z.object({
  name: analyticsEventNameSchema,
  userId: entityId.optional(),
  occurredAt: isoDateString,
  version: z.literal("2026-03"),
  properties: z.record(z.string(), z.unknown()).default({}),
});
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export const supportRequestSchema = z.object({
  id: entityId,
  profileId: entityId,
  subject: z.string().min(3).max(120),
  body: z.string().min(10).max(4000),
  status: supportStatusSchema.default("open"),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});
export type SupportRequest = z.infer<typeof supportRequestSchema>;

export const seedPreview = {
  profile: {
    id: "profile_demo",
    clerkUserId: "user_demo",
    role: "consumer",
    firstName: "June",
    email: "june@example.com",
    timezone: "Europe/Helsinki",
    locale: "en-US",
    marketingConsent: true,
    analyticsConsent: true,
    createdAt: "2026-03-15T10:00:00.000Z",
    updatedAt: "2026-03-15T10:00:00.000Z",
  } satisfies Profile,
  goal: {
    id: "goal_demo",
    profileId: "profile_demo",
    title: "Ship the productivity companion",
    description:
      "Launch the first polished agentic release across web and mobile.",
    status: "active",
    priority: "high",
    createdAt: "2026-03-15T10:00:00.000Z",
    updatedAt: "2026-03-15T10:00:00.000Z",
  } satisfies Goal,
};

export const domainSchemas = {
  analyticsEventSchema,
  approvalSchema,
  artifactSchema,
  agentMessageSchema,
  agentThreadSchema,
  entitlementSchema,
  goalSchema,
  notificationSchema,
  profileSchema,
  projectSchema,
  supportRequestSchema,
  toolRunSchema,
  workflowRunSchema,
};
