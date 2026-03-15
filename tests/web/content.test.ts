import { describe, expect, it } from "vitest";

import {
  getChangelogEntry,
  getDocsContent,
  getMarketingData,
} from "../../apps/web/lib/content";

describe("web content loaders", () => {
  it("loads docs and changelog content for the public site", async () => {
    const docs = await getDocsContent();
    const changelog = await getChangelogEntry();

    expect(docs.data.title).toBe("Getting started");
    expect(changelog.data.title).toBe("March 15, 2026");
  });

  it("hydrates marketing data with the latest changelog block", async () => {
    const marketing = await getMarketingData();

    expect(marketing.statBlocks).toHaveLength(3);
    expect(marketing.productPillars[0]).toContain("Expo product app");
    expect(marketing.latestChangelog.data.title).toBe("March 15, 2026");
  });
});
