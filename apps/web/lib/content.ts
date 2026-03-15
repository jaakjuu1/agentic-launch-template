import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

const root = path.join(process.cwd(), "content");

export const getDocsContent = cache(async () => {
  const source = await readFile(
    path.join(root, "docs", "getting-started.mdx"),
    "utf8",
  );
  return matter(source);
});

export const getChangelogEntry = cache(async () => {
  const source = await readFile(
    path.join(root, "changelog", "2026-03-15.mdx"),
    "utf8",
  );
  return matter(source);
});

export async function getMarketingData() {
  const stats = Promise.resolve([
    { label: "Time to launch", value: "days, not months" },
    { label: "State model", value: "reactive + durable" },
    { label: "AI posture", value: "approval-first" },
  ]);

  const pillars = Promise.resolve([
    "Expo product app with release-ready settings, deep links, and restore flows",
    "Convex-first backend with durable workflows, auth boundaries, and webhook plumbing",
    "Cloudflare R2 private storage with signed uploads, generated exports, and retrieval hooks",
    "AI SDK UI layer plus Convex Agent persistence and optional OpenAI orchestration",
  ]);

  const changelog = getChangelogEntry();

  const [statBlocks, productPillars, latestChangelog] = await Promise.all([
    stats,
    pillars,
    changelog,
  ]);

  return { latestChangelog, productPillars, statBlocks };
}
