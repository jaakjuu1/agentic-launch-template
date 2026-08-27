import { mutation } from "./_generated/server";
import { getOrCreateViewerProfile } from "./lib/auth";
import { ensureDemoRecords } from "./lib/demo";
import { isDemoMode } from "./lib/env";

/**
 * Seed example records for the calling viewer. Only available when
 * DEMO_MODE=true — production deployments never expose seed data.
 */
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    if (!isDemoMode()) {
      throw new Error("seedDemoData is only available when DEMO_MODE=true");
    }

    const profile = await getOrCreateViewerProfile(ctx);
    await ensureDemoRecords(ctx, profile._id);
    return profile._id;
  },
});
