import { mutation } from "./_generated/server";
import { getOrCreateViewerProfile } from "./lib/auth";
import { ensureDemoRecords } from "./lib/demo";

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getOrCreateViewerProfile(ctx);
    if (profile === null) {
      throw new Error("Unable to resolve viewer profile");
    }

    await ensureDemoRecords(ctx, profile._id);
    return profile._id;
  },
});
