# Project documentation

This folder is a step-by-step build log of the shopping-list app: one document per phase, written to be re-readable later as both a personal reference and a portfolio piece. Each phase document explains not just _what_ was built, but _why_ each piece exists — the goal is that you could rebuild the phase from the doc alone, and explain any file in it in an interview.

## Phases

- [Phase 1 — Project foundation](phase-01-foundation.md): Vite/React/TypeScript scaffold, PWA config, testing setup (Vitest + Playwright), linting/formatting, CI pipeline.
- [Phase 2 — Auth & households](phase-02-auth-households.md): Supabase schema + Row Level Security, sign-in/sign-up, shared households, invite codes.
- [Phase 3 — Lists screen](phase-03-lists.md): the lists table, client-side routing, the base "lists overview" screen and create-list form.
- [Phase 4 — Items catalog](phase-04-items.md): the items table, fractional-index ranking, drag-to-reorder, and the shared `useAsyncData` hook.
- [Phase 5 — Items on lists](phase-05-list-items.md): adding items two ways, the check-off/swipe distinction, trolley/list totals, and "start next shop."
- [Phase 6 — Design system](phase-06-design-system.md): Tailwind + shadcn/ui, the "iOS-Native Fresh" palette, and restyling every screen from Phases 1–5 without touching their logic.
- [Phase 7 — Groups (meals)](phase-07-groups.md): the groups catalog, rename/add/remove-item management, and the first phase built styled from the start.
- [Phase 8 — Groups on lists](phase-08-groups-on-lists.md): the pre-selected/deselect/confirm flow for adding a whole group to a list — zero new migrations, pure composition of existing RLS policies.
- Later phases: added as they're built.

## How each doc is structured

Every step follows the same three questions:

1. **What did we do?** — the concrete action (a command, a file).
2. **Why did we do it?** — the immediate technical reason.
3. **Why does it matter for this project?** — how it ties back to the app's three goals: a real shared shopping list, a test-automation/CI learning exercise, and a job-hunting showcase.
