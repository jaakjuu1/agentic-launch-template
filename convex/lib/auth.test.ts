import { afterEach, describe, expect, it } from "vitest";

import { deriveFirstName, getViewerIdentity, parseRoleClaim } from "./auth";

const originalDemoMode = process.env.DEMO_MODE;

afterEach(() => {
  if (originalDemoMode === undefined) {
    delete process.env.DEMO_MODE;
  } else {
    process.env.DEMO_MODE = originalDemoMode;
  }
});

function ctxWithIdentity(identity: unknown) {
  return {
    auth: {
      getUserIdentity: async () => identity,
    },
  } as never;
}

describe("convex auth helpers", () => {
  it("rejects unauthenticated requests by default", async () => {
    delete process.env.DEMO_MODE;
    await expect(getViewerIdentity(ctxWithIdentity(null))).rejects.toThrow(
      /Not authenticated/,
    );
  });

  it("returns the shared demo viewer only when DEMO_MODE=true", async () => {
    process.env.DEMO_MODE = "true";
    const viewer = await getViewerIdentity(ctxWithIdentity(null));
    expect(viewer.clerkUserId).toBe("user_demo");
    expect(viewer.claimedRole).toBe("consumer");
  });

  it("reads identity fields and the app:role claim from the JWT", async () => {
    const viewer = await getViewerIdentity(
      ctxWithIdentity({
        "app:role": "operator",
        email: "ops@internal.example",
        familyName: "Rivera",
        givenName: "Alex",
        subject: "user_ops",
        tokenIdentifier: "clerk|user_ops",
      }),
    );

    expect(viewer.clerkUserId).toBe("user_ops");
    expect(viewer.claimedRole).toBe("operator");
    expect(viewer.firstName).toBe("Alex");
  });

  it("never grants roles from email heuristics", async () => {
    const viewer = await getViewerIdentity(
      ctxWithIdentity({
        email: "someone@example.com",
        subject: "user_plain",
        tokenIdentifier: "clerk|operator-lookalike",
      }),
    );

    expect(viewer.claimedRole).toBe("consumer");
  });

  it("parses only known role claims", () => {
    expect(parseRoleClaim("admin")).toBe("admin");
    expect(parseRoleClaim("operator")).toBe("operator");
    expect(parseRoleClaim("superuser")).toBe("consumer");
    expect(parseRoleClaim(undefined)).toBe("consumer");
  });

  it("derives a display name without leaking placeholders", () => {
    expect(deriveFirstName({ email: "jane@x.dev", firstName: "Jane" })).toBe(
      "Jane",
    );
    expect(deriveFirstName({ email: "jane.doe@x.dev" })).toBe("jane.doe");
    expect(deriveFirstName({ email: "" })).toBe("Member");
  });
});
