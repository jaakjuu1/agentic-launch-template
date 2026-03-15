import { describe, expect, it } from "vitest";

import {
  assertUploadAllowed,
  buildObjectKey,
  resolveStorageLimits,
  sanitizeFileName,
} from "./index";

describe("storage helpers", () => {
  it("builds stable profile-scoped object keys", () => {
    expect(
      buildObjectKey({
        createdAt: new Date("2026-03-15T10:00:00.000Z"),
        fileId: "file_demo",
        fileName: "Launch Brief.pdf",
        profileId: "profile_demo",
        purpose: "project_attachment",
      }),
    ).toBe(
      "profiles/profile_demo/project_attachment/2026/03/file_demo/Launch-Brief.pdf",
    );
  });

  it("sanitizes filenames into safe ASCII keys", () => {
    expect(sanitizeFileName("  Bränd plan (final).md  ")).toBe(
      "Brand-plan-final-.md",
    );
  });

  it("enforces tier-aware upload limits", () => {
    expect(() =>
      assertUploadAllowed({
        fileName: "video.mp4",
        mimeType: "video/mp4",
        sizeBytes: 128,
        tier: "free",
        totalUsageBytes: 0,
      }),
    ).toThrow("Unsupported file type");

    expect(() =>
      assertUploadAllowed({
        fileName: "brief.pdf",
        mimeType: "application/pdf",
        sizeBytes: resolveStorageLimits("free").maxFileBytes + 1,
        tier: "free",
        totalUsageBytes: 0,
      }),
    ).toThrow("per-file limit");
  });
});
