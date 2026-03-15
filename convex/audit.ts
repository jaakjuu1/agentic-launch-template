import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

import { nowIso } from "./lib/time";

export const recordEvent = internalMutation({
  args: {
    actorId: v.optional(v.string()),
    payload: v.optional(v.any()),
    source: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("auditEvents", {
      actorId: args.actorId,
      createdAt: nowIso(),
      payload: args.payload,
      source: args.source,
      title: args.title,
    }),
});

export const recordWebhookEvent = internalMutation({
  args: {
    payload: v.optional(v.any()),
    source: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args): Promise<string> =>
    ctx.db.insert("auditEvents", {
      actorId: undefined,
      createdAt: nowIso(),
      payload: args.payload,
      source: args.source,
      title: args.title,
    }),
});
