import { describe, expect, it } from "vitest";

import {
  canExtractTextFromMime,
  chunkExtractedText,
  normalizeEtag,
  sumActiveFileBytes,
} from "./storage";

describe("convex storage helpers", () => {
  it("normalizes ETags and sums active bytes", () => {
    expect(normalizeEtag('"abc123"')).toBe("abc123");
    expect(
      sumActiveFileBytes([
        { sizeBytes: 4, status: "ready" },
        { sizeBytes: 6, status: "deleted" },
        { sizeBytes: 10, status: "pending_upload" },
      ] as never),
    ).toBe(14);
  });

  it("chunks extracted text for retrieval and only flags supported types", () => {
    const chunks = chunkExtractedText("a".repeat(2500));

    expect(chunks).toHaveLength(3);
    expect(canExtractTextFromMime("application/pdf")).toBe(true);
    expect(canExtractTextFromMime("image/png")).toBe(false);
  });
});
