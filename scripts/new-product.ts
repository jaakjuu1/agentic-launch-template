/**
 * Rebrand this template into a new product.
 *
 *   corepack pnpm new-product -- \
 *     --name "Trail Coach" \
 *     --slug trail-coach \
 *     --bundle-id com.yourcompany.trailcoach \
 *     [--tagline "..."] [--company "Your Company Oy"] \
 *     [--email support@yourdomain.com] [--marketing-url https://yourdomain.com]
 *
 * Missing flags are prompted for interactively. The script rewrites the
 * single source of truth (packages/config/src/product.ts), the root
 * package name, and resets the changelog — everything else reads product
 * identity from the config at build time.
 *
 * After running it, follow docs/ROADMAP.md.
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { productConfig } from "../packages/config/src/product";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

type Answers = {
  bundleId: string;
  company?: string;
  email?: string;
  marketingUrl?: string;
  name: string;
  slug: string;
  tagline?: string;
};

function parseArgs(argv: string[]): Partial<Answers> {
  const result: Partial<Answers> = {};
  const mapping: Record<string, keyof Answers> = {
    "--bundle-id": "bundleId",
    "--company": "company",
    "--email": "email",
    "--marketing-url": "marketingUrl",
    "--name": "name",
    "--slug": "slug",
    "--tagline": "tagline",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = mapping[argv[index] ?? ""];
    const value = argv[index + 1];
    if (key && value !== undefined) {
      result[key] = value;
      index += 1;
    }
  }

  return result;
}

const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
const BUNDLE_PATTERN = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i;

async function collectAnswers(): Promise<Answers> {
  const fromArgs = parseArgs(process.argv.slice(2));
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  async function ask(
    label: string,
    fallback: string | undefined,
    validate?: (value: string) => boolean,
  ): Promise<string> {
    for (;;) {
      const suffix = fallback ? ` [${fallback}]` : "";
      const raw = (await rl.question(`${label}${suffix}: `)).trim();
      const value = raw.length > 0 ? raw : (fallback ?? "");
      if (value.length === 0) {
        console.log("  A value is required.");
        continue;
      }
      if (validate && !validate(value)) {
        console.log("  Invalid format, try again.");
        continue;
      }
      return value;
    }
  }

  const name =
    fromArgs.name ?? (await ask("Product name (e.g. Trail Coach)", undefined));
  const defaultSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug =
    fromArgs.slug && SLUG_PATTERN.test(fromArgs.slug)
      ? fromArgs.slug
      : await ask("Slug (lowercase, dashes)", defaultSlug, (value) =>
          SLUG_PATTERN.test(value),
        );
  const bundleId =
    fromArgs.bundleId && BUNDLE_PATTERN.test(fromArgs.bundleId)
      ? fromArgs.bundleId
      : await ask(
          "Bundle id (reverse-DNS, e.g. com.yourcompany.trailcoach)",
          undefined,
          (value) => BUNDLE_PATTERN.test(value),
        );

  const tagline =
    fromArgs.tagline ?? (await ask("One-line tagline", productConfig.tagline));
  const company =
    fromArgs.company ??
    (await ask("Company legal name", productConfig.company.legalName));
  const email =
    fromArgs.email ??
    (await ask("Support email", productConfig.company.supportEmail));
  const marketingUrl =
    fromArgs.marketingUrl ??
    (await ask("Marketing site URL", productConfig.urls.marketing));

  rl.close();
  return { bundleId, company, email, marketingUrl, name, slug, tagline };
}

function replaceOnce(content: string, from: string, to: string, file: string) {
  if (from === to) {
    return content;
  }
  if (!content.includes(from)) {
    // An earlier replacement may already have handled a shared value
    // (slug == scheme, iosBundleId == androidPackage); only warn when
    // the target value is missing too.
    if (!content.includes(to)) {
      console.warn(`  ! Could not find "${from}" in ${file} — skipped.`);
    }
    return content;
  }
  return content.split(from).join(to);
}

async function main() {
  const answers = await collectAnswers();

  // 1. Product config — the single source of truth.
  const configPath = path.join(repoRoot, "packages/config/src/product.ts");
  let config = readFileSync(configPath, "utf8");
  config = replaceOnce(
    config,
    `name: "${productConfig.name}"`,
    `name: "${answers.name}"`,
    configPath,
  );
  // slug + scheme share the same value by convention.
  config = replaceOnce(
    config,
    `"${productConfig.slug}"`,
    `"${answers.slug}"`,
    configPath,
  );
  config = replaceOnce(
    config,
    `"${productConfig.mobile.scheme}"`,
    `"${answers.slug}"`,
    configPath,
  );
  config = replaceOnce(
    config,
    `"${productConfig.mobile.iosBundleId}"`,
    `"${answers.bundleId}"`,
    configPath,
  );
  config = replaceOnce(
    config,
    `"${productConfig.mobile.androidPackage}"`,
    `"${answers.bundleId}"`,
    configPath,
  );
  if (answers.tagline) {
    config = replaceOnce(
      config,
      JSON.stringify(productConfig.tagline),
      JSON.stringify(answers.tagline),
      configPath,
    );
  }
  if (answers.company) {
    config = replaceOnce(
      config,
      `"${productConfig.company.legalName}"`,
      `"${answers.company}"`,
      configPath,
    );
  }
  if (answers.email) {
    config = replaceOnce(
      config,
      `"${productConfig.company.supportEmail}"`,
      `"${answers.email}"`,
      configPath,
    );
  }
  if (answers.marketingUrl) {
    config = replaceOnce(
      config,
      `"${productConfig.urls.marketing}"`,
      `"${answers.marketingUrl}"`,
      configPath,
    );
  }
  writeFileSync(configPath, config);
  console.log("✔ packages/config/src/product.ts updated");

  // 2. Root package name.
  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = answers.slug;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("✔ package.json name updated");

  // 3. Reset the changelog with a fresh first entry.
  const changelogDir = path.join(repoRoot, "apps/web/content/changelog");
  for (const file of readdirSync(changelogDir)) {
    if (file.endsWith(".mdx")) {
      rmSync(path.join(changelogDir, file));
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(
    path.join(changelogDir, `${today}.mdx`),
    `---\ntitle: "${answers.name} is in development"\ndate: "${today}"\n---\n\nProject started from the agentic launch template.\n`,
  );
  console.log("✔ changelog reset");

  // 4. Format what we touched.
  try {
    execSync("pnpm exec biome check --write packages/config/src/product.ts", {
      cwd: repoRoot,
      stdio: "ignore",
    });
  } catch {
    // formatting is best-effort
  }

  console.log(`
Done. ${answers.name} is ready to build.

Next steps (full plan in docs/ROADMAP.md):
  1. Fill in docs/PRODUCT_SPEC.md — what the product does, who it serves,
     what the agent's job is.
  2. Rewrite the agent persona in packages/config/src/product.ts
     (agent.instructions) to match the spec.
  3. corepack pnpm install && corepack pnpm dev
  4. Work through the roadmap phase by phase.
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
