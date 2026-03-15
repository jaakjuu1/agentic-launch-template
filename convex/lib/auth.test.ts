import { describe, expect, it } from "vitest";

import { getViewerIdentity } from "./auth";

describe("convex auth helpers", () => {
  it("returns the preview fallback identity for unauthenticated requests", async () => {
    const viewer = await getViewerIdentity({
      auth: {
        getUserIdentity: async () => null,
      },
    } as never);

    expect(viewer).toEqual({
      clerkUserId: "user_demo",
      email: "june@example.com",
      role: "consumer",
    });
  });

  it("flags operator contexts from token metadata", async () => {
    const viewer = await getViewerIdentity({
      auth: {
        getUserIdentity: async () => ({
          email: "ops@launchops.internal",
          subject: "user_ops",
          tokenIdentifier: "clerk|operator",
        }),
      },
    } as never);

    expect(viewer.role).toBe("operator");
    expect(viewer.clerkUserId).toBe("user_ops");
  });
});
