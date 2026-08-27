# Launch roadmap: from idea to shipped AI agent app

This is the execution plan for turning a product idea into a working,
launchable app on top of this template. Work through the phases in order;
each phase ends with a working state you can demo. The checklists are
written so you (or an AI coding agent) can execute them directly —
`CLAUDE.md` tells the agent how to work in this repo, and this file tells
it what to build next.

**The golden path:** clone → spec → rename → adapt the domain model →
teach the agent its job → wire billing & integrations → polish → ship.

---

## Phase 0 — Spec the product (½ day)

Goal: a filled-in `docs/PRODUCT_SPEC.md` that an engineer or AI agent can
build from without asking questions.

- [ ] Copy the questions in `docs/PRODUCT_SPEC.md` and answer all of them:
      who the user is, the core loop, what the agent does autonomously,
      what always needs human approval, what is free vs. pro.
- [ ] Name the 3–6 core entities of your domain (the template ships with
      goals / projects / artifacts as placeholders to rename or replace).
- [ ] Decide the launch surfaces: mobile-first, web-first, or both.
      (The template gives you both; deleting one is cheaper at the start.)

## Phase 1 — Clone and rebrand (½ day)

Goal: the template runs locally under the new product's name.

- [ ] Clone the repo, `corepack pnpm install`.
- [ ] Run `corepack pnpm new-product` — sets name, slug, bundle id,
      company, support email in `packages/config/src/product.ts` (the
      single source of truth for product identity) and resets the
      changelog.
- [ ] Rewrite `agent.instructions` and `agent.displayName` in
      `packages/config/src/product.ts` from the spec — this is the
      product's personality.
- [ ] Update pricing tiers in the same file (names, prices, features).
- [ ] `corepack pnpm dev` — Expo app + web app + package watchers start.
      Without any env vars the apps run in **offline demo mode** with
      fixture data; that is expected.
- [ ] Create a Convex dev deployment: `corepack pnpm --filter
      @launch/convex dev` (creates the deployment on first run), then
      `npx convex env set DEMO_MODE true` for local development, and set
      `EXPO_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL` in the app
      `.env.local` files. Now the apps run against a live backend as the
      shared demo viewer.
- [ ] Verify green baseline: `corepack pnpm typecheck && corepack pnpm
      test && corepack pnpm build`.

## Phase 2 — Adapt the domain model (1–2 days)

Goal: the schema and screens speak your product's language instead of the
template's goals/projects/artifacts placeholder domain.

- [ ] Rename/replace tables in `convex/schema.ts` per your spec. Keep the
      infrastructure tables as-is: `profiles`, `entitlements`, `files`,
      `fileAttachments`, `fileChunks`, `notifications`, `approvals`,
      `workflowRuns`, `auditEvents`.
- [ ] Follow the conventions in `CLAUDE.md` → "Add a new table" (index
      per access path, `profileId: v.id("profiles")` ownership column,
      viewer-scoped list queries).
- [ ] Update `convex/bootstrap.ts` (dashboard query) and
      `convex/lib/demo.ts` (demo seed) to your entities.
- [ ] Update the Expo screens under `apps/product/app/(tabs)/` and the
      offline fixtures in `apps/product/lib/reference-data.ts` to match.
- [ ] Keep `corepack pnpm typecheck` green as you go; run `corepack pnpm
      --filter @launch/convex codegen` after schema changes once a dev
      deployment is linked.

## Phase 3 — Teach the agent its job (1–3 days)

Goal: the assistant tab does the product's actual work.

- [ ] Define the agent's tools in `convex/agent.ts`. The template ships
      two patterns to copy: `requestArtifactTool` (queue a durable
      background workflow) and `riskyApprovalTool` (gate an action behind
      human approval). Every tool that touches user data must resolve the
      profile via `resolveToolProfile` and validate ownership of any
      model-supplied ids (see `internal.projects.resolveOwnedProjectId`).
- [ ] Rewrite `runArtifactWorkflow` in `convex/workflows.ts` into your
      product's core generation/processing workflow. Keep the shape:
      mark running → do the work with the model → store the result →
      notify → mark completed, all inside try/catch that records
      `lastError` and a failure notification.
- [ ] Choose models: default lives in `productConfig.agent.defaultModel`,
      per-deployment override via `npx convex env set AI_MODEL ...`.
      Swapping providers is documented in `convex/lib/ai.ts`.
- [ ] If the product needs retrieval over uploaded files, the pipeline
      (upload → extract → chunk → embed) already runs; wire
      `ctx.vectorSearch` on `fileChunks.by_embedding` into your agent
      tools where relevant.
- [ ] Add schedule-driven behavior in `convex/crons.ts` (the weekly
      digest shows the fan-out pattern).

## Phase 4 — Real accounts and billing (1–2 days)

Goal: real users can sign in and pay. Follow `docs/integrations.md` for
each service — it lists the exact dashboard steps, env vars, and the
webhook contracts the backend already implements.

- [ ] Clerk: create the app, add the `convex` JWT template, set
      `CLERK_JWT_ISSUER_DOMAIN`, wire the webhook (profile sync + account
      deletion are already implemented). Set publishable keys in both
      apps. Turn OFF demo mode on any shared deployment.
- [ ] Grant yourself the operator role via Clerk public metadata
      `{ "app:role": "operator" }` and check `/operator` on the web app.
- [ ] Stripe (web checkout): create the product/price, point the webhook
      at `/webhooks/stripe`. The handler expects checkout sessions
      created with `client_reference_id = clerkUserId` and
      `metadata.productKey` — add your checkout-session endpoint per
      `docs/integrations.md`.
- [ ] RevenueCat (mobile): install `react-native-purchases`, call
      `Purchases.logIn(clerkUserId)`, build the paywall purchase flow,
      set the webhook Authorization token. Entitlement sync is already
      implemented; map entitlement ids in `productConfig.pricing`.
- [ ] Gate pro features with `api.billing.listEntitlements` +
      `mergeEntitlements` (see `packages/billing`).

## Phase 5 — Files, storage, and content (½–1 day, if the product needs it)

- [ ] Cloudflare R2: create the bucket, set the `R2_*` env vars, add the
      CORS rules for your web origins (`docs/integrations.md`).
- [ ] Uploads, signed downloads, deletion, text extraction and embedding
      already work end-to-end — test them from the app.
- [ ] Replace marketing copy: `apps/web/app/page.tsx` hero,
      `apps/web/content/docs/getting-started.mdx`, legal pages with real
      policies.

## Phase 6 — Quality pass (1–2 days)

- [ ] Replace template placeholder icons/splash: add
      `apps/product/assets/` (icon, adaptive-icon, splash) and reference
      them from `app.config.ts`.
- [ ] Observability: add PostHog + Sentry SDKs where you need them (env
      hooks exist in the config schemas; respect `analyticsConsent` on
      the profile).
- [ ] Push notifications: register Expo push tokens and deliver
      `notifications` rows with channel "push" (a `sentAt` field and
      delivery loop are the missing pieces — the in-app inbox already
      works).
- [ ] Run the security checklist in `docs/architecture.md` → "Security
      model": every new query/mutation goes through the viewer helpers,
      every new webhook verifies signatures, demo mode off in prod.
- [ ] Write tests for your domain logic (patterns: `convex/lib/*.test.ts`
      for backend units, `tests/e2e` for web smoke).

## Phase 7 — Ship (1–2 days)

- [ ] Convex: create the production deployment, set ALL env vars from
      `convex/.env.example` (no DEMO_MODE), `npx convex deploy`.
- [ ] Web: deploy `apps/web` (e.g. Vercel: root `apps/web`, set env
      vars). Point Stripe/Clerk webhooks at production URLs.
- [ ] Mobile: `eas init` (updates `easProjectId` in product config), fill
      the `env` blocks in `eas.json`, `eas build --profile production`,
      then store listings + `eas submit`.
- [ ] App-store readiness: working restore-purchases button, account
      deletion (implemented via Clerk user deletion), privacy policy
      URLs, tracking-permission strings in `app.config.ts`.
- [ ] Post-launch: watch `/operator` (support queue, failed workflows),
      Convex logs, and billing webhooks' audit trail (`auditEvents`).

---

## Scope guidance

Cut in this order when time-boxed: web marketing polish → mobile push
delivery → RevenueCat (launch web-billing-only) → vector retrieval.
Never cut: auth correctness, webhook signature verification, the
approval gate on risky agent actions, entitlement checks.
