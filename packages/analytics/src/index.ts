import {
  type AnalyticsEvent,
  type analyticsEventNameSchema,
  analyticsEventSchema,
} from "@launch/domain";

const eventDescriptions = {
  app_opened: "Core session start and foreground resumes.",
  approval_decided: "Risky tool requests have been approved or rejected.",
  approval_requested:
    "A workflow needs human approval before side effects continue.",
  artifact_ready: "A background workflow produced a user-visible artifact.",
  artifact_requested: "A user requested generated work from the assistant.",
  checkout_started: "A user moved from paywall to checkout.",
  entitlement_activated:
    "A subscription or lifetime entitlement became active.",
  file_deleted: "A stored file was deleted or tombstoned.",
  file_download_requested: "A signed download URL was requested.",
  file_upload_completed: "A file upload completed and became durable state.",
  file_upload_failed: "A file upload or processing step failed.",
  file_upload_started: "A file upload was initialized for a signed PUT.",
  goal_created: "A new goal was created in the companion.",
  notification_opened: "A user opened a notification or deep link.",
  paywall_viewed: "The premium upsell surface was shown.",
  project_created: "A new project was created.",
  support_requested: "A support request was submitted.",
} satisfies Record<(typeof analyticsEventNameSchema.options)[number], string>;

export type AnalyticsSink = (event: AnalyticsEvent) => Promise<void> | void;

export function buildAnalyticsEvent(
  event: Omit<AnalyticsEvent, "version"> & {
    version?: AnalyticsEvent["version"];
  },
) {
  return analyticsEventSchema.parse({
    ...event,
    version: event.version ?? "2026-03",
  });
}

export function describeAnalyticsEvent(name: AnalyticsEvent["name"]) {
  return eventDescriptions[name];
}

export async function fanOutAnalyticsEvent(
  event: AnalyticsEvent,
  sinks: readonly AnalyticsSink[],
) {
  const payload = analyticsEventSchema.parse(event);
  await Promise.all(sinks.map(async (sink) => sink(payload)));
  return payload;
}

export function toPosthogCapture(event: AnalyticsEvent) {
  return {
    distinctId: event.userId ?? "anonymous",
    event: event.name,
    properties: {
      ...event.properties,
      specVersion: event.version,
      occurredAt: event.occurredAt,
    },
  };
}
