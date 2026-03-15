# Agentic Launch Template

Reusable monorepo starter for consumer AI products built with Expo, Next.js, Convex, Clerk, Stripe + RevenueCat, and an agent-ready AI stack.

## Workspace

- `apps/product`: Expo + React Native + Expo Router product app for iOS, Android, and web.
- `apps/web`: Next.js marketing, docs, pricing, support, and operator/admin surfaces.
- `convex`: backend schema, workflows, webhooks, and AI-adjacent state orchestration.
- `packages/*`: shared contracts, adapters, tokens, and UI primitives.
- `packages/storage`: Cloudflare R2 helpers, upload policy, and backend-only storage adapter code.

## Core flows

- Clerk-backed auth across mobile, web, and operator surfaces
- Hybrid entitlements merged from Stripe web billing and RevenueCat mobile billing
- Convex-backed goals, projects, artifacts, notifications, approvals, and support flows
- Private Cloudflare R2 file storage with signed uploads, signed downloads, and file-indexing hooks
- Vercel AI SDK UI layer with a Convex-persisted agent/workflow model and optional OpenAI Agents orchestration

## Commands

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm build
corepack pnpm test
corepack pnpm test:e2e
```

Run `corepack pnpm codegen` after you have linked a Convex deployment with `corepack pnpm --filter @launch/convex dev`.

## Environment

Copy the example env files before running local development:

- `.env.example`
- `apps/product/.env.example`
- `apps/web/.env.example`
- `convex/.env.example`
- Configure R2 CORS for your product and operator web origins before enabling live uploads.

## Release rails

- `eas.json` ships `development`, `preview`, and `production` channels for Expo builds.
- `.github/workflows/ci.yml` runs install, typecheck, unit/integration tests, and production builds on every push and pull request.
- `playwright.config.ts` and `tests/e2e` provide a browser smoke-test harness for the public web surface.

## Reference product

- Individual-user AI productivity companion with goals, projects, generated artifacts, approvals, notifications, billing, and support.
- Durable agent threads, tool runs, approvals, and workflow state live in Convex and are shared across the Expo app and Next.js operator/admin surfaces.
- Stored files, attachment links, and generated artifact exports are modeled as first-class Convex records backed by Cloudflare R2.
