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

  it("falls back to trusted operator email suffixes", () => {
    expect(
      deriveRoleFromClaims({
        email: "ops@launchops.internal",
      }),
    ).toBe("operator");
    expect(isTrustedOperatorEmail("builder@example.com")).toBe(true);
  });

  it("defaults unknown roles to consumer", () => {
    expect(resolveRole("unknown-role")).toBe("consumer");
  });
});
