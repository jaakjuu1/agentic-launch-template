# Agentic Launch Template

A production-oriented monorepo template for shipping consumer **AI agent
apps** fast: clone it, run one script, follow the roadmap, launch.

**Stack:** Expo (iOS/Android/web) · Next.js (marketing + operator
console) · Convex (data, durable agent workflows, webhooks, crons) ·
Clerk (auth) · Stripe + RevenueCat (hybrid billing) · Cloudflare R2
(private file storage with retrieval pipeline) · Vercel AI SDK +
Convex Agent (persistent assistant with tools and human-in-the-loop
approvals).

## Start a new product

```bash
git clone <this-repo> my-product && cd my-product
corepack pnpm install
corepack pnpm new-product        # name, slug, bundle id, company → one config file
corepack pnpm dev                # runs immediately in offline demo mode
```

Then work through **[docs/ROADMAP.md](docs/ROADMAP.md)** — the phase-by-
phase path from idea to app-store launch. Define the product first in
**[docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)**; if you build with
Claude Code or another AI agent, `CLAUDE.md` teaches it this repo's
commands, invariants, and extension recipes.

## What you get working out of the box

- **A real assistant**: persistent threads (Convex Agent component),
  tool calls that queue durable background workflows, and an approval
  gate that routes risky actions to a human decision.
- **Secure defaults**: Clerk-validated identities, profile-based roles
  (operator access via the Clerk `app:role` claim), ownership checks on
  every user-scoped row, signature-verified + deduped webhooks, and an
  explicit `DEMO_MODE` flag instead of silent auth fallbacks.
- **Billing that syncs itself**: Stripe and RevenueCat webhooks upsert
  entitlements idempotently; `packages/billing` merges tiers across
  sources.
- **Files done right**: presigned R2 uploads with quota enforcement
  (re-checked against real uploaded size), text extraction → chunking →
  embeddings, signed downloads, GDPR-grade deletion cascades.
- **A real UI kit**: shadcn-style components for React Native
  (react-native-reusables vendored into `packages/ui-native`, NativeWind
  + Radix-on-web) themed by shared design tokens — restyle the whole
  product from one palette.
- **Ops**: role-gated operator console (support queue, failed workflows,
  storage activity), audit log, cron cleanup, weekly digest fan-out.
- **Rails**: CI (lint, typecheck, tests, builds, Playwright e2e), EAS
  build channels, strict TS, Biome.

## Progressive modes

The template runs at every configuration level, so day one is never
blocked on dashboards:

| Mode | Requirements | You get |
|---|---|---|
| Offline demo | nothing | apps render with fixture data |
| Live demo | Convex deployment + `DEMO_MODE=true` | real backend, anonymous shared viewer |
| Full | + Clerk (+ OpenAI, R2, billing keys) | real accounts, real AI, real billing |

## Workspace

```
apps/product     Expo app (dashboard, assistant, projects, notifications,
                 paywall, settings, support)
apps/web         Next.js marketing site + /operator console
convex/          backend: schema, auth, agent, workflows, webhooks, crons,
                 storage, operator API
packages/        config (product identity + env schemas), domain, billing,
                 auth, storage, ai, analytics, design-tokens, ui-web, ui-native
docs/            ROADMAP · PRODUCT_SPEC · architecture · integrations
scripts/         new-product rebranding script
```

## Commands

```bash
corepack pnpm dev / build / typecheck / test / test:e2e / format
corepack pnpm --filter @launch/convex dev   # create/link a Convex deployment
corepack pnpm codegen                       # regen convex/_generated after schema changes
```

## Documentation

- [docs/ROADMAP.md](docs/ROADMAP.md) — idea → launch, with checklists
- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — the product definition template
- [docs/architecture.md](docs/architecture.md) — how the pieces fit, security model
- [docs/integrations.md](docs/integrations.md) — Clerk/Stripe/RevenueCat/R2/OpenAI setup, exact steps
- [CLAUDE.md](CLAUDE.md) — AI-agent development guide for this repo
