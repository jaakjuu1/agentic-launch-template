# Architecture

One monorepo, three runtime surfaces, one backend:

```
apps/product   Expo + Expo Router + NativeWind   iOS / Android / web app
apps/web       Next.js (App Router, RSC-first)   marketing + operator console
convex/        Convex backend                    data, auth, agent, workflows,
                                                 webhooks, crons, file storage
packages/      shared code                       config, domain, billing, auth,
                                                 storage, ai, analytics, tokens,
                                                 ui-web, ui-native
```

## Where things live

| Concern | Location |
|---|---|
| Product identity (name, slug, bundle ids, pricing, agent persona/model) | `packages/config/src/product.ts` — the ONE file to edit when cloning |
| Env var schemas + parsing | `packages/config/src/index.ts`; examples in `.env.example` files |
| Database schema | `convex/schema.ts` (embedding dims from `convex/lib/env.ts`) |
| Auth + roles | `convex/auth.config.ts`, `convex/lib/auth.ts`, `convex/profiles.ts` |
| The AI agent + tools | `convex/agent.ts` (persistence via `@convex-dev/agent` component) |
| Model selection | `convex/lib/ai.ts` (`AI_MODEL` env → productConfig default) |
| Durable workflows | `convex/workflows.ts`; schedules in `convex/crons.ts` |
| Human-in-the-loop approvals | `convex/approvals.ts` + `riskyApprovalTool` in `convex/agent.ts` |
| Billing webhooks → entitlements | `convex/http.ts` → `convex/lib/billingEvents.ts` → `convex/billing.ts` |
| Entitlement merge logic (Stripe + RevenueCat + admin) | `packages/billing` |
| File storage (R2) | public API `convex/storage.ts`; Node-only internals `convex/storageNode.ts`; helpers `packages/storage` |
| Webhook signature verification | `convex/lib/webhooks.ts` (Svix + Stripe, Web Crypto) |
| Operator console backend | `convex/operator.ts` (role-gated) |

## Data flow: the assistant

1. App calls `api.agent.createThread` → thread persisted by the agent
   component, owned by the Clerk user id.
2. `api.agent.sendPrompt` (action) verifies thread ownership, resolves
   ready file attachments into prompt context, and runs the agent with
   its tools.
3. Tools queue durable work: `requestArtifactTool` inserts a
   `workflowRuns` row and schedules `runArtifactWorkflow`, which calls
   the model, stores an `artifacts` row, exports a copy to R2, and
   enqueues a notification — all observable from the UI via reactive
   queries.
4. Risky actions insert an `approvals` row instead of executing;
   `api.approvals.decideApproval` (ownership-checked) records the
   decision.

## Data flow: files

`beginUpload` (quota + policy check, presigned PUT) → client PUTs to R2 →
`completeUpload` (idempotent; re-validates the REAL uploaded size) →
`processReadyFile` (extract text → chunk → embed → `fileChunks`) →
attachments become usable in prompts and downloads via short-lived signed
URLs. Deletion tombstones the row and purges chunks/attachment links;
account deletion cascades everything including R2 objects.

## Security model

- **Authentication:** Clerk JWTs validated by Convex via
  `convex/auth.config.ts`. `getViewerIdentity` throws for anonymous
  callers unless the deployment explicitly sets `DEMO_MODE=true`
  (local/dev only — anonymous callers then share one demo profile).
- **Authorization:** the `profiles.role` column is the source of truth
  (`consumer` / `operator` / `admin`), set ONLY from the Clerk
  `app:role` public-metadata claim (synced by webhook / first sign-in).
  Operator surfaces call `requireOperatorProfile`. Never derive roles
  from emails or token strings.
- **Row ownership:** every user-owned table carries
  `profileId: v.id("profiles")` and an index starting with it; list
  queries filter by the viewer's profile, mutations check ownership
  before patching (see `decideApproval` for the pattern).
- **Webhooks:** every endpoint verifies provider signatures
  (Svix/Stripe/shared token), dedupes by provider event id via
  `auditEvents.dedupeKey`, and caps stored payload size. Unconfigured
  secrets fail closed (503).
- **Agent inputs are untrusted:** tool args come from a model. Validate
  ids (`db.normalizeId` + ownership check) and route side effects through
  approvals.

## Conventions

- Strict TS everywhere (`noUncheckedIndexedAccess`); Biome for
  lint/format (`corepack pnpm format`).
- Convex: public functions take/return validated args; anything called
  by other functions is `internalQuery/Mutation/Action`. Node-only code
  (`"use node"`) stays in `storageNode.ts`-style files.
- Packages build with tsup to `dist/`; apps transpile from source via
  tsconfig paths — new subpath exports need entries in the package
  `exports`, `tsconfig.base.json` + app tsconfigs, and
  `vitest.config.ts` aliases.
- Tests: vitest from the repo root (`corepack pnpm test`) picks up every
  `*.test.ts(x)` under `convex/`, `packages/`, `tests/`.
- `convex/_generated` is committed. After schema/function changes, `pnpm
  --filter @launch/convex codegen` regenerates it (needs a linked
  deployment); keep new modules registered in `_generated/api.d.ts` if
  you cannot run codegen.

## Known gaps (intentional, documented)

Tracked as roadmap items rather than half-built code: push/email
notification delivery (rows are stored, no delivery loop),
`react-native-purchases` SDK integration on the paywall, PostHog/Sentry
SDK wiring, vector-search-backed retrieval in prompts (embeddings are
written; `resolvePromptAttachments` currently concatenates chunks), and a
Stripe checkout-session endpoint (webhook side is done — see
`docs/integrations.md` for the contract).
