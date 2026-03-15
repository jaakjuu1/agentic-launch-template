import { buildAnalyticsEvent } from "@launch/analytics";
import { mergeEntitlements } from "@launch/billing";
import { seedPreview } from "@launch/domain";

export const dashboardStats = [
  { label: "Active goals", value: "3" },
  { label: "Artifacts ready", value: "12" },
  { label: "Pending approvals", value: "1" },
] as const;

export type ReferenceLaunchFile = {
  detail: string;
  fileName: string;
  id: string;
  sizeBytes: number;
  status: string;
};

export const referenceProjects = [
  {
    id: "project_launch",
    name: "Launch boilerplate",
    summary: "Ship auth, billing, notifications, and operator workflows.",
    progress: 72,
    status: "Workflow running",
  },
  {
    id: "project_growth",
    name: "Retention loops",
    summary: "Build push + email nudges around unfinished projects.",
    progress: 44,
    status: "Needs approval",
  },
  {
    id: "project_support",
    name: "Support inbox",
    summary: "Route critical account and billing issues to operators.",
    progress: 88,
    status: "Ready to QA",
  },
] as const;

export const referenceThread = {
  id: "thread_demo",
  title: "Weekly artifact planner",
  summary: "Persistent assistant thread with background workflow state.",
  attachments: [
    {
      detail: "PDF, private, ready for retrieval",
      fileName: seedPreview.file.fileName,
      id: seedPreview.file.id,
      sizeBytes: seedPreview.file.sizeBytes,
      status: "Ready",
    },
  ] satisfies ReferenceLaunchFile[],
  messages: [
    {
      id: "message_1",
      role: "assistant",
      content:
        "I can turn your active projects into launch artifacts, queue follow-up tasks, and request approval before any risky action.",
    },
    {
      id: "message_2",
      role: "user",
      content:
        "Draft a release brief for the mobile launch and flag anything that needs approval.",
    },
    {
      id: "message_3",
      role: "assistant",
      content:
        "Release brief queued. I marked outbound customer email and subscription copy changes as approval-gated steps.",
    },
  ],
};

export const referenceProjectFiles = [
  {
    detail: "Project attachment · PDF · private",
    fileName: "launch-brief.pdf",
    id: "file_project_1",
    sizeBytes: 48213,
    status: "Ready",
  },
  {
    detail: "Generated export · Markdown · vector indexed",
    fileName: "retention-workflows.md",
    id: "file_project_2",
    sizeBytes: 14280,
    status: "Indexed",
  },
] satisfies ReferenceLaunchFile[];

export const referenceSupportFiles = [
  {
    detail: "Support attachment · PNG screenshot",
    fileName: "billing-mismatch.png",
    id: "file_support_1",
    sizeBytes: 318002,
    status: "Ready",
  },
] satisfies ReferenceLaunchFile[];

export const referenceArtifactExports = [
  {
    detail: "Artifact export · Markdown",
    fileName: "mobile-launch-brief.md",
    id: "file_artifact_1",
    sizeBytes: 9213,
    status: "Ready",
  },
] satisfies ReferenceLaunchFile[];

export const referenceNotifications = [
  {
    id: "notification_1",
    title: "Artifact ready",
    body: "Your launch brief is ready to review.",
    tone: "success" as const,
  },
  {
    id: "notification_2",
    title: "Approval requested",
    body: "Pricing copy change requires operator approval.",
    tone: "warning" as const,
  },
];

export const referenceEntitlements = mergeEntitlements([
  {
    id: "ent_demo",
    profileId: seedPreview.profile.id,
    source: "stripe",
    tier: "pro",
    productKey: "pro_monthly",
    active: true,
    createdAt: "2026-03-15T10:00:00.000Z",
    updatedAt: "2026-03-15T10:00:00.000Z",
    metadata: {},
  },
]);

export const onboardingEvent = buildAnalyticsEvent({
  name: "app_opened",
  occurredAt: "2026-03-15T10:00:00.000Z",
  properties: { surface: "mobile" },
  userId: seedPreview.profile.id,
});
