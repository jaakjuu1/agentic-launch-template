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

/**
 * Record a webhook delivery with replay protection: when `dedupeKey`
 * (provider event id) has been seen before, no row is written and
 * `alreadyProcessed` is true so the caller can skip side effects.
 */
export const recordWebhookEvent = internalMutation({
  args: {
    dedupeKey: v.optional(v.string()),
    payload: v.optional(v.any()),
    source: v.string(),
    title: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ alreadyProcessed: boolean; eventId: string | null }> => {
    if (args.dedupeKey !== undefined) {
      const existing = await ctx.db
        .query("auditEvents")
        .withIndex("by_dedupe_key", (query) =>
          query.eq("dedupeKey", args.dedupeKey),
        )
        .first();

      if (existing !== null) {
        return { alreadyProcessed: true, eventId: existing._id };
      }
    }

    const eventId = await ctx.db.insert("auditEvents", {
      createdAt: nowIso(),
      dedupeKey: args.dedupeKey,
      payload: args.payload,
      source: args.source,
      title: args.title,
    });

    return { alreadyProcessed: false, eventId };
  },
});
