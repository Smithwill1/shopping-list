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
- [Phase 9 — Validation & polish](phase-09-validation-polish.md): an audit across every form — shared validation/error-formatting helpers, and fixing three "Add" actions that silently swallowed insert errors.
- [Phase 10 — PWA & realtime polish](phase-10-pwa-realtime.md): Supabase Realtime on lists/list_items, an offline indicator, a real hang-forever bug fixed in `useAsyncData`, and deploy guidance. The last phase in the original plan.
- [Phase 11 — Floating add button & modal forms](phase-11-floating-add-button.md): the first post-launch fix — a floating "+" replacing the old scroll-to-the-top/scroll-to-the-bottom add flow on Lists, Items, and Groups, with a proper modal dialog instead of an inline form.
- [Phase 12 — Multi-select catalog modal & item quantities](phase-12-item-quantities.md): a real `quantity` column on list items, a multi-select-with-quantity modal for adding from the catalog in bulk, and a fixed quick-add bar on the list-detail screen.

Phases 1–10 are the original plan, in order. Later phases are ongoing iteration — real usage surfacing real fixes — documented the same way.

## How each doc is structured

Every step follows the same three questions:

1. **What did we do?** — the concrete action (a command, a file).
2. **Why did we do it?** — the immediate technical reason.
3. **Why does it matter for this project?** — how it ties back to the app's three goals: a real shared shopping list, a test-automation/CI learning exercise, and a job-hunting showcase.
