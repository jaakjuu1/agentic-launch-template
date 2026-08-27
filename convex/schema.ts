import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { EMBEDDING_DIMENSIONS } from "./lib/env";

export default defineSchema({
  approvals: defineTable({
    createdAt: v.string(),
    decidedAt: v.optional(v.string()),
    decidedBy: v.optional(v.string()),
    description: v.string(),
    profileId: v.id("profiles"),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("expired"),
    ),
    title: v.string(),
    toolRunId: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_status", ["status"]),
  artifacts: defineTable({
    body: v.string(),
    createdAt: v.string(),
    embedding: v.optional(v.array(v.float64())),
    kind: v.union(
      v.literal("plan"),
      v.literal("brief"),
      v.literal("draft"),
      v.literal("image"),
      v.literal("report"),
    ),
    profileId: v.id("profiles"),
    projectId: v.optional(v.id("projects")),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    title: v.string(),
    updatedAt: v.string(),
    workflowRunId: v.optional(v.id("workflowRuns")),
  })
    .index("by_profile", ["profileId"])
    .index("by_project", ["projectId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["profileId"],
    })
    .vectorIndex("by_embedding", {
      dimensions: EMBEDDING_DIMENSIONS,
      filterFields: ["profileId"],
      vectorField: "embedding",
    }),
  auditEvents: defineTable({
    actorId: v.optional(v.string()),
    createdAt: v.string(),
    dedupeKey: v.optional(v.string()),
    payload: v.optional(v.any()),
    source: v.string(),
    title: v.string(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_dedupe_key", ["dedupeKey"]),
  entitlements: defineTable({
    active: v.boolean(),
    createdAt: v.string(),
    expiresAt: v.optional(v.string()),
    metadata: v.optional(v.any()),
    originalTransactionId: v.optional(v.string()),
    productKey: v.string(),
    profileId: v.id("profiles"),
    renewsAt: v.optional(v.string()),
    source: v.union(
      v.literal("stripe"),
      v.literal("revenuecat"),
      v.literal("admin"),
    ),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("lifetime")),
    updatedAt: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_product", ["profileId", "productKey"]),
  fileAttachments: defineTable({
    createdAt: v.string(),
    fileId: v.id("files"),
    profileId: v.id("profiles"),
    role: v.union(
      v.literal("primary"),
      v.literal("source"),
      v.literal("reference"),
    ),
    targetId: v.string(),
    targetType: v.union(
      v.literal("project"),
      v.literal("artifact"),
      v.literal("agent_message"),
      v.literal("support_request"),
    ),
  })
    .index("by_file", ["fileId"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_profile_target", ["profileId", "targetType", "targetId"]),
  fileChunks: defineTable({
    chunkIndex: v.number(),
    content: v.string(),
    createdAt: v.string(),
    embedding: v.optional(v.array(v.float64())),
    fileId: v.id("files"),
    profileId: v.id("profiles"),
  })
    .index("by_file", ["fileId"])
    .index("by_profile", ["profileId"])
    .vectorIndex("by_embedding", {
      dimensions: EMBEDDING_DIMENSIONS,
      filterFields: ["profileId"],
      vectorField: "embedding",
    }),
  files: defineTable({
    bucket: v.string(),
    createdAt: v.string(),
    deletedAt: v.optional(v.string()),
    etag: v.optional(v.string()),
    fileName: v.string(),
    lastError: v.optional(v.string()),
    mimeType: v.string(),
    objectKey: v.string(),
    origin: v.union(
      v.literal("user_upload"),
      v.literal("agent_generated"),
      v.literal("operator_upload"),
      v.literal("system_generated"),
    ),
    profileId: v.id("profiles"),
    purpose: v.union(
      v.literal("project_attachment"),
      v.literal("artifact_export"),
      v.literal("assistant_attachment"),
      v.literal("support_attachment"),
      v.literal("generated_output"),
      v.literal("knowledge_base"),
    ),
    readyAt: v.optional(v.string()),
    sizeBytes: v.number(),
    status: v.union(
      v.literal("pending_upload"),
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
      v.literal("deleted"),
    ),
    updatedAt: v.string(),
    uploadedAt: v.optional(v.string()),
    uploadStrategy: v.union(v.literal("single")),
    visibility: v.union(v.literal("private")),
  })
    .index("by_object_key", ["objectKey"])
    .index("by_profile", ["profileId"])
    .index("by_profile_status", ["profileId", "status"])
    .index("by_status_created", ["status", "createdAt"])
    .searchIndex("search_name", {
      searchField: "fileName",
      filterFields: ["profileId"],
    }),
  goals: defineTable({
    createdAt: v.string(),
    description: v.string(),
    dueAt: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    profileId: v.id("profiles"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("done"),
    ),
    title: v.string(),
    updatedAt: v.string(),
  })
    .index("by_profile", ["profileId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["profileId"],
    }),
  notifications: defineTable({
    body: v.string(),
    channel: v.union(
      v.literal("in_app"),
      v.literal("push"),
      v.literal("email"),
    ),
    createdAt: v.string(),
    deepLink: v.optional(v.string()),
    profileId: v.id("profiles"),
    readAt: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    title: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_read", ["profileId", "readAt"]),
  profiles: defineTable({
    analyticsConsent: v.boolean(),
    avatarUrl: v.optional(v.string()),
    clerkUserId: v.string(),
    createdAt: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    locale: v.string(),
    marketingConsent: v.boolean(),
    role: v.union(
      v.literal("consumer"),
      v.literal("operator"),
      v.literal("admin"),
    ),
    timezone: v.string(),
    updatedAt: v.string(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_role", ["role"]),
  projects: defineTable({
    createdAt: v.string(),
    goalId: v.optional(v.id("goals")),
    name: v.string(),
    profileId: v.id("profiles"),
    progressPercent: v.number(),
    summary: v.string(),
    tags: v.array(v.string()),
    updatedAt: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_goal", ["goalId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["profileId"],
    }),
  supportRequests: defineTable({
    body: v.string(),
    createdAt: v.string(),
    profileId: v.id("profiles"),
    status: v.union(
      v.literal("open"),
      v.literal("triaged"),
      v.literal("resolved"),
    ),
    subject: v.string(),
    updatedAt: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_status", ["status"]),
  toolRuns: defineTable({
    approvalId: v.optional(v.id("approvals")),
    argsJson: v.any(),
    createdAt: v.string(),
    description: v.string(),
    resultJson: v.optional(v.any()),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("requires_approval"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    threadId: v.string(),
    toolName: v.string(),
    updatedAt: v.string(),
    workflowRunId: v.optional(v.id("workflowRuns")),
  })
    .index("by_thread", ["threadId"])
    .index("by_status", ["status"]),
  workflowRuns: defineTable({
    createdAt: v.string(),
    kind: v.union(
      v.literal("artifact_generation"),
      v.literal("weekly_digest"),
      v.literal("support_follow_up"),
      v.literal("billing_sync"),
      v.literal("file_processing"),
      v.literal("file_cleanup"),
    ),
    lastError: v.optional(v.string()),
    profileId: v.id("profiles"),
    projectId: v.optional(v.id("projects")),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("awaiting_input"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    threadId: v.optional(v.string()),
    trigger: v.union(
      v.literal("user"),
      v.literal("schedule"),
      v.literal("webhook"),
      v.literal("operator"),
    ),
    updatedAt: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_status", ["status"]),
});
