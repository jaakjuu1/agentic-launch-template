import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Abandoned uploads: presigned PUT URLs that were issued but never
// completed leave pending rows (and possibly orphaned objects) behind.
crons.interval(
  "cleanup stale uploads",
  { hours: 1 },
  internal.storageNode.cleanupStaleUploads,
  {},
);

// Weekly digest notification for every profile.
crons.weekly(
  "weekly digest",
  { dayOfWeek: "monday", hourUTC: 7, minuteUTC: 0 },
  internal.workflows.runWeeklyDigestForAllProfiles,
  {},
);

export default crons;
