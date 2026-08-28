# AGENTS.md

Agent instructions for this repository live in **[CLAUDE.md](CLAUDE.md)**
— read it first. It contains the operating procedure for building a
complete product (backend + both frontends) from this template, the
commands, the non-negotiable invariants, extension recipes, and gotchas.

The intent of this repo: take a product idea, define it in
`docs/PRODUCT_SPEC.md`, and execute `docs/ROADMAP.md` phase by phase
until a working, launchable AI-agent app exists. A task is finished only
when the feature works end-to-end in the apps and
`pnpm format && pnpm typecheck && pnpm test && pnpm build` are green.

Key documents:

- [CLAUDE.md](CLAUDE.md) — the full agent guide (canonical)
- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — the product definition to build from
- [docs/ROADMAP.md](docs/ROADMAP.md) — the phase-by-phase execution plan
- [docs/architecture.md](docs/architecture.md) — system map and security model
- [docs/integrations.md](docs/integrations.md) — per-service setup steps
