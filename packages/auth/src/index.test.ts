import { describe, expect, it } from "vitest";

import {
  deriveRoleFromClaims,
  isTrustedOperatorEmail,
  resolveRole,
} from "./index";

describe("auth helpers", () => {
  it("resolves operator roles from Clerk metadata first", () => {
    expect(
      deriveRoleFromClaims({
        clerkPublicMetadata: { "app:role": "admin" },
        email: "person@example.com",
      }),
    ).toBe("admin");
  });

  it("does not promote anyone based on email alone by default", () => {
    expect(
      deriveRoleFromClaims({
        email: "ops@launchops.internal",
      }),
    ).toBe("consumer");
    expect(isTrustedOperatorEmail("builder@example.com")).toBe(false);
  });

  it("defaults unknown roles to consumer", () => {
    expect(resolveRole("unknown-role")).toBe("consumer");
  });
});
