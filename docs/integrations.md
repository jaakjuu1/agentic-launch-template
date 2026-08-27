# Integration setup

Exact steps per service. Every webhook endpoint below is already
implemented and signature-verified in `convex/http.ts` — your job is only
the dashboard configuration and env vars. Convex deployment env vars are
set with `npx convex env set NAME value` (run from the repo root, or use
the Convex dashboard).

Your Convex HTTP base URL is `https://<deployment-name>.convex.site`.

## Convex (required)

1. `corepack pnpm --filter @launch/convex dev` — first run creates a dev
   deployment and writes `CONVEX_DEPLOYMENT` locally.
2. Copy the URL it prints into `apps/product/.env.local`
   (`EXPO_PUBLIC_CONVEX_URL`) and `apps/web/.env.local`
   (`NEXT_PUBLIC_CONVEX_URL`).
3. Local dev convenience: `npx convex env set DEMO_MODE true` — anonymous
   callers share a demo profile and seed data appears. **Never in
   production.**
4. After schema/function changes: `corepack pnpm codegen`.
5. Production: `npx convex deploy` with all env vars from
   `convex/.env.example` set on the prod deployment.

## Clerk (required for real users)

1. Create a Clerk application (email code sign-in is what the mobile
   sign-in screen implements out of the box).
2. **JWT template:** Clerk dashboard → JWT templates → New → choose the
   Convex preset, name it exactly `convex`. Add a custom claim so roles
   flow into the backend:
   `{ "app:role": "{{user.public_metadata.app:role}}" }`.
3. Env vars:
   - Convex deployment: `CLERK_JWT_ISSUER_DOMAIN` = the template's
     Issuer (your Clerk Frontend API URL, `https://....clerk.accounts.dev`).
   - `apps/product/.env.local`: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
   - `apps/web/.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
     `CLERK_SECRET_KEY`.
4. **Webhook (profile sync + account deletion):** Clerk dashboard →
   Webhooks → Add endpoint → `https://<deployment>.convex.site/webhooks/clerk`,
   subscribe to `user.created`, `user.updated`, `user.deleted`. Copy the
   signing secret → `npx convex env set CLERK_WEBHOOK_SECRET whsec_...`.
5. **Operator access:** in Clerk → Users → your user → Public metadata:
   `{ "app:role": "operator" }`. The webhook (or next sign-in) syncs it
   to the profile; `/operator` on the web app then works.

## OpenAI (required for real AI output)

- `npx convex env set OPENAI_API_KEY sk-...`
- Optional: `AI_MODEL` (chat) and `AI_EMBEDDING_MODEL` overrides. The
  defaults come from `productConfig.agent.defaultModel` and
  `convex/lib/env.ts`. If you change the embedding model, keep
  `EMBEDDING_DIMENSIONS` in `convex/lib/env.ts` in sync and re-embed.
- Different provider (e.g. Anthropic): swap the provider import in
  `convex/lib/ai.ts` (and embeddings in `convex/storageNode.ts`); the
  rest of the backend sees only the AI SDK interfaces.

## Stripe (web billing)

Webhook side is implemented; you add the checkout entry point.

1. Create a Product + recurring Price for each paid tier. Put the price
   id where the web app can read it (e.g. `STRIPE_PRICE_ID_PRO_MONTHLY`,
   as named by `stripePriceIdEnvVar` in `productConfig.pricing`).
2. **Webhook:** Stripe dashboard → Developers → Webhooks → Add endpoint
   → `https://<deployment>.convex.site/webhooks/stripe` with events
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Signing secret →
   `npx convex env set STRIPE_WEBHOOK_SECRET whsec_...`.
3. **Checkout contract** (what the webhook expects): create Checkout
   Sessions with
   ```js
   client_reference_id: clerkUserId,
   metadata: { productKey: "pro_monthly" },
   subscription_data: {
     metadata: { clerkUserId, productKey: "pro_monthly" },
   },
   ```
   The natural place is a Next.js route handler
   (`apps/web/app/api/checkout/route.ts`) using `STRIPE_SECRET_KEY` and
   the signed-in Clerk user — build it when you wire the pricing-page
   CTA (Phase 4 of the roadmap).
4. Entitlements land in the `entitlements` table via an idempotent
   upsert; the apps read them through `api.billing.listEntitlements` and
   merge tiers with `packages/billing`.

## RevenueCat (mobile billing)

1. Create the RevenueCat project + entitlement (default id `pro`, mapped
   in `productConfig.pricing.tiers[].revenuecatEntitlementId`), attach
   store products.
2. App side (Phase 4): add `react-native-purchases`, initialize with the
   platform key (`EXPO_PUBLIC_REVENUECAT_*`), and call
   `Purchases.logIn(clerkUserId)` after sign-in — the webhook keys
   entitlements by `app_user_id`, so it must be the Clerk user id.
3. **Webhook:** RevenueCat dashboard → Integrations → Webhooks → URL
   `https://<deployment>.convex.site/webhooks/revenuecat`, set an
   Authorization header value, then
   `npx convex env set REVENUECAT_WEBHOOK_AUTH_TOKEN <same value>`.

## Cloudflare R2 (file storage)

1. Create a private bucket; create an API token with Object Read & Write
   scoped to it.
2. `npx convex env set` each of: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET` (plus optional TTL/size
   overrides — see `convex/.env.example`).
3. **CORS** (required for browser uploads): bucket → Settings → CORS,
   allow methods `PUT,GET` and headers `content-type,content-disposition`
   for your app origins (`http://localhost:8081`,
   `http://localhost:3000`, and your production domains).

## Resend (email, optional)

- `npx convex env set RESEND_API_KEY re_...` when you build email
  delivery; delivery-event webhook at
  `https://<deployment>.convex.site/webhooks/resend` with
  `RESEND_WEBHOOK_SECRET` (Svix scheme) — currently audit-logged.

## PostHog / Sentry (optional)

Env slots exist in the config schemas (`EXPO_PUBLIC_POSTHOG_KEY`,
`EXPO_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN`, …).
SDK initialization is a Phase 6 roadmap task — gate analytics on
`profile.analyticsConsent` (the consent toggles in settings already write
it).

## EAS / app stores

1. `npx eas init` — copy the project id into
   `productConfig.mobile.easProjectId`.
2. Fill the `env` blocks in `eas.json` per profile.
3. `eas build --profile preview` for internal installs; `production` +
   `eas submit` when store listings are ready.
