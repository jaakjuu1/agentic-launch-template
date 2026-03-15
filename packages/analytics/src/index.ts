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
