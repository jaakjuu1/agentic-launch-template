# CLAUDE.md

Monorepo template for consumer AI-agent products: Expo app +
Next.js web + Convex backend + Clerk auth + Stripe/RevenueCat billing +
Cloudflare R2 storage + Vercel AI SDK / Convex Agent.

**Building a new product from this template? Read `docs/ROADMAP.md` and
execute it phase by phase; the product definition belongs in
`docs/PRODUCT_SPEC.md`. Architecture and conventions: `docs/architecture.md`.
Service setup: `docs/integrations.md`.**

## Operating procedure: from spec to finished app

The goal of this repo is a FINISHED product. You are expected to deliver
both the backend and the frontends — a feature is done only when it works
end-to-end in the apps, not when the Convex function exists.

1. **Orient.** Read `docs/PRODUCT_SPEC.md`. If it still contains ✎
   placeholders, get it filled in (ask the user, or draft answers from
   their idea and confirm) BEFORE writing code — it defines the domain
   model, the agent's job, and pricing. Then open `docs/ROADMAP.md`,
   find the first unfinished phase, and treat its checklist as your work
   queue. Run `corepack pnpm new-product` first if the repo still says
   "Agentic Launch".
2. **Replace the placeholder domain.** `goals` / `projects` /
   `artifacts` (and the screens built on them) are a reference domain
   meant to be renamed or replaced per the spec. The infrastructure
   tables are NOT placeholders — keep `profiles`, `entitlements`,
   `files`, `fileAttachments`, `fileChunks`, `notifications`,
   `approvals`, `workflowRuns`, `toolRuns`, `auditEvents`.
3. **Work in vertical slices.** For each feature: schema → viewer-scoped
   Convex functions → agent tool/workflow when the agent drives it →
   Expo screen (all three app modes, see below) → web surface if
   relevant → tests. Run `corepack pnpm typecheck && corepack pnpm test`
   after every slice, not just at the end.
4. **Follow the frontend patterns already in place:**
   - Expo screens branch on the app mode from
     `apps/product/lib/app-mode.ts`: `"offline"` renders fixtures from
     `apps/product/lib/reference-data.ts`; live modes use
     `useQuery(api..., ...)` gated with the `"skip"` pattern in
     `apps/product/lib/use-live-enabled.ts`. When you change a screen,
     update its offline fixtures too so the zero-config demo stays
     honest. File uploads go through `apps/product/lib/use-file-upload.ts`.
   - Web marketing pages stay RSC-only; interactive surfaces follow the
     operator-console pattern (client component under
     `apps/web/components/convex-client-provider.tsx`). New operator API
     functions must also be added to the typed facade in
     `apps/web/lib/convex-generated-api.ts`.
   - All user-visible product identity comes from
     `packages/config/src/product.ts` — never hardcode it.
5. **Definition of done** before reporting a task complete:
   `corepack pnpm format && corepack pnpm typecheck && corepack pnpm test
   && corepack pnpm build` all green, plus `corepack pnpm test:e2e` when
   `apps/web` changed. A roadmap phase is done when its checklist items
   are demonstrably true in the running app, and `docs/ROADMAP.md` has
   its boxes checked.

## Commands

```bash
corepack pnpm install
corepack pnpm dev                      # all apps + package watchers
corepack pnpm typecheck                # turbo, all workspaces
corepack pnpm test                     # vitest, whole repo (all *.test.ts)
corepack pnpm build                    # production builds
corepack pnpm test:e2e                 # Playwright web smoke tests
corepack pnpm format                   # Biome write mode
corepack pnpm new-product              # rebrand the template (interactive)
corepack pnpm --filter @launch/convex dev      # Convex dev deployment
corepack pnpm codegen                  # regenerate convex/_generated (needs linked deployment)
```

Run a single test file: `corepack pnpm exec vitest run convex/lib/auth.test.ts`.

## Non-negotiable invariants

1. **Auth:** every public Convex query/mutation resolves the viewer via
   `getViewerProfile` / `getOrCreateViewerProfile` / `requireViewerProfile`
   (`convex/lib/auth.ts`); actions use `getViewerIdentity` + an internal
   profile lookup. Roles come from `profiles.role` only — never from
   emails, token substrings, or client input. Operator surfaces use
   `requireOperatorProfile`.
2. **Ownership:** user-owned tables have `profileId: v.id("profiles")` +
   an index starting with it. List queries filter by the viewer's
   profile; mutations load the row and compare `profileId` before
   patching (pattern: `decideApproval` in `convex/approvals.ts`).
3. **Webhooks** (`convex/http.ts`): verify the provider signature
   (`convex/lib/webhooks.ts`), dedupe via
   `internal.audit.recordWebhookEvent` with a `dedupeKey`, fail closed
   (503) when the secret env is missing, cap stored payloads.
4. **Agent tools** (`convex/agent.ts`): model-supplied ids are untrusted
   — validate with `db.normalizeId` + ownership (see
   `internal.projects.resolveOwnedProjectId`). Side-effectful actions go
   through the approvals gate, not direct execution.
5. **Demo mode:** anonymous access, seed data, and `grantPreviewPro`
   exist ONLY behind `DEMO_MODE=true` (`convex/lib/env.ts`). Never widen
   what demo mode exposes.
6. **Workflows** (`convex/workflows.ts`): long work runs in
   `internalAction`s that mark status running → completed/failed with
   `lastError`, and notify the user on both outcomes.
7. **Product identity** (names, slugs, bundle ids, pricing, agent
   persona/model) lives in `packages/config/src/product.ts`. Never
   hardcode product-specific strings in apps or backend — import
   `productConfig`.

## Recipes

**Add a table:** define in `convex/schema.ts` (alphabetical field order,
`profileId: v.id("profiles")`, index per access path) → run
`corepack pnpm codegen` if a deployment is linked (otherwise types flow
automatically; `_generated/dataModel.d.ts` derives from the schema) →
add viewer-scoped queries/mutations in a new `convex/<table>.ts` → if
you add a new module file, register it in `convex/_generated/api.d.ts`
(two places, alphabetical) when you can't run codegen.

**Add an agent tool:** copy `requestArtifactTool` in `convex/agent.ts`
(zod args with `.describe()`, `resolveToolProfile`, ownership-validated
ids, return small JSON). Wire durable work through
`internal.workflows.createWorkflowRecord` + a scheduled internal action.

**Add a workflow:** internal mutation to create the `workflowRuns` row +
`internalAction` doing the work inside try/catch (model calls via
`resolveChatModel()` from `convex/lib/ai.ts`), notification on finish;
schedule from a tool, a cron (`convex/crons.ts`), or a webhook.

**Add an app screen (Expo):** file under `apps/product/app/` (Expo
Router). Data via `useQuery(api...)` with the offline-mode skip pattern
used by existing tabs; mutations/actions wrapped in try/catch with
inline error text. Reuse `@launch/ui-native` + existing components.

**Add a package subpath export:** package.json `exports` + tsup entry +
`tsconfig.base.json` and app tsconfig `paths` + `vitest.config.ts` alias
(specific subpaths BEFORE the package root alias).

## Gotchas

- `convex/_generated` is committed; `convex codegen` needs a linked
  deployment (`CONVEX_DEPLOYMENT`). Keep manual edits to `api.d.ts`
  alphabetical or CI typechecks drift.
- Biome enforces formatting repo-wide — run `corepack pnpm format`
  before committing; CI runs `biome ci .`.
- Strict TS with `noUncheckedIndexedAccess`: `array[0]` is `T |
  undefined`.
- Vitest aliases workspace packages to `src/`, apps import them via
  tsconfig paths, but bundlers resolve built `dist/` through package
  `exports` — new exports must update both sides.
- The web app must build with zero env vars (offline/CI); guard all env
  access, never module-scope-crash on missing keys. Fonts load at
  runtime by design — do not reintroduce `next/font/google` (build-time
  network fetch).
- Convex functions that reference `internal.<ownModule>.*` need explicit
  handler return-type annotations (TS self-reference limitation).
