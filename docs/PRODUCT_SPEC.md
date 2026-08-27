# Product spec

Fill this in before writing code (Phase 0 of `docs/ROADMAP.md`). Short,
concrete answers beat long ones — this document is the contract an
engineer or AI coding agent builds from. Replace every ✎ block.

## 1. One-liner

✎ *"[Product] helps [who] do [what] by [how the agent helps]."*

## 2. User and problem

- **Target user:** ✎ who exactly? (consumer? prosumer? which niche?)
- **Painful problem today:** ✎ what do they struggle with, in their words?
- **Why an agent:** ✎ what does autonomy/AI add that a plain app cannot?

## 3. Core loop

Describe the repeating loop that makes the product valuable. The template
implements: *set a goal → agent turns it into projects/artifacts → user
reviews → agent continues in the background*. Rewrite for your product:

1. ✎ user does …
2. ✎ agent does …
3. ✎ user gets … and comes back because …

## 4. Domain model

List the 3–6 core entities and their key fields/states. These replace the
template's `goals` / `projects` / `artifacts` placeholders in
`convex/schema.ts`.

| Entity | Purpose | Key fields / states | Owned by user? |
|---|---|---|---|
| ✎ | ✎ | ✎ | yes/no |

## 5. The agent's job description

This becomes `productConfig.agent.instructions` and the tool set in
`convex/agent.ts`.

- **Persona / tone:** ✎
- **Does autonomously (no confirmation):** ✎ e.g. draft content, organize,
  summarize, schedule background work
- **Requires human approval (use the approval gate):** ✎ e.g. sending
  anything external, purchases, deletions
- **Must never do:** ✎
- **Tools it needs:** ✎ name → what it does → side effects

## 6. Background work

What continues when the app is closed? (These become workflows in
`convex/workflows.ts` + crons in `convex/crons.ts`.)

- ✎ e.g. nightly summary, watch X and notify, generate Y after Z

## 7. Files / knowledge

- Does the user upload files? ✎ which types, for what?
- Does the agent need retrieval over them (vector search)? ✎

## 8. Monetization

Fills `productConfig.pricing.tiers`.

- **Free tier includes:** ✎
- **Pro tier (price ✎) includes:** ✎
- **Paywall moment:** ✎ when does the user hit it?
- **Platforms:** web billing (Stripe) / mobile billing (RevenueCat) / both ✎

## 9. Surfaces

- **Mobile app tabs:** ✎ (template: dashboard / assistant / projects /
  notifications)
- **Web:** marketing only, or logged-in web app too? ✎
- **Operator console needs:** ✎ what must you see to support users?

## 10. Launch definition

- **v1 must have:** ✎ 5 bullets max
- **Explicitly out of v1:** ✎
- **Success in 30 days:** ✎ a number you can measure
