# Project documentation

This folder is a step-by-step build log of the shopping-list app: one document per phase, written to be re-readable later as both a personal reference and a portfolio piece. Each phase document explains not just _what_ was built, but _why_ each piece exists — the goal is that you could rebuild the phase from the doc alone, and explain any file in it in an interview.

## Phases

- [Phase 1 — Project foundation](phase-01-foundation.md): Vite/React/TypeScript scaffold, PWA config, testing setup (Vitest + Playwright), linting/formatting, CI pipeline.
- [Phase 2 — Auth & households](phase-02-auth-households.md): Supabase schema + Row Level Security, sign-in/sign-up, shared households, invite codes.
- Later phases: added as they're built.

## How each doc is structured

Every step follows the same three questions:

1. **What did we do?** — the concrete action (a command, a file).
2. **Why did we do it?** — the immediate technical reason.
3. **Why does it matter for this project?** — how it ties back to the app's three goals: a real shared shopping list, a test-automation/CI learning exercise, and a job-hunting showcase.
