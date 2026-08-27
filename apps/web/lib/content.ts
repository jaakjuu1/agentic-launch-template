import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { productConfig } from "@launch/config/product";
import matter from "gray-matter";
import { cache } from "react";

// Resolve the content directory whether the process runs from apps/web
// (next dev/build) or the repo root (vitest).
function resolveContentRoot(): string {
  const local = path.join(process.cwd(), "content");
  const fromRepoRoot = path.join(process.cwd(), "apps", "web", "content");
  return existsSync(local) ? local : fromRepoRoot;
}

const root = resolveContentRoot();

export const getDocsContent = cache(async () => {
  const source = await readFile(
    path.join(root, "docs", "getting-started.mdx"),
    "utf8",
  );
  return matter(source);
});

/**
 * Newest changelog entry by filename (files are named YYYY-MM-DD.mdx, so
 * a lexicographic sort is a date sort). Drop a new file in
 * content/changelog/ — no code change needed.
 */
export const getChangelogEntry = cache(async () => {
  const dir = path.join(root, "changelog");
  const entries = (await readdir(dir))
    .filter((file) => file.endsWith(".mdx"))
    .sort()
    .reverse();

  const latest = entries[0];
  if (!latest) {
    throw new Error(`No changelog entries found in ${dir}`);
  }

  const source = await readFile(path.join(dir, latest), "utf8");
  return matter(source);
});

export async function getMarketingData() {
  const latestChangelog = await getChangelogEntry();

  // Hero copy is driven entirely by the product config so a rebrand
  // (editing packages/config/src/product.ts) rebrands the homepage too.
  const hero = {
    name: productConfig.name,
    tagline: productConfig.tagline,
    description: productConfig.description,
    docsUrl: productConfig.urls.docs,
  };

  const statBlocks = [
    { label: "Time to launch", value: "days, not months" },
    { label: "State model", value: "reactive + durable" },
    { label: "AI posture", value: "approval-first" },
  ];

  const productPillars = [
    "Expo product app with release-ready settings, deep links, and restore flows",
    "Convex-first backend with durable workflows, auth boundaries, and webhook plumbing",
    "Cloudflare R2 private storage with signed uploads, generated exports, and retrieval hooks",
    "AI SDK UI layer plus Convex Agent persistence and configurable models",
  ];

  return { hero, latestChangelog, productPillars, statBlocks };
}
