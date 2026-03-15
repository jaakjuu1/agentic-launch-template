import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

import { nowIso } from "./lib/time";

export const recordWebhookEvent = internalMutation({
  args: {
    payload: v.optional(v.any()),
    source: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("auditEvents", {
      createdAt: nowIso(),
      payload: args.payload,
      source: args.source,
      title: args.title,
    }),
});
