# Shopping List

A shared, mobile-first shopping list PWA for two accounts to manage together — built as both a real app and a showcase project for test automation and CI/CD.

## Stack

- **React + TypeScript + Vite** — app shell
- **Tailwind CSS + shadcn/ui** — styling and UI primitives ("iOS-Native Fresh" theme)
- **Supabase** — auth, database, realtime sync (added in Phase 2)
- **vite-plugin-pwa** — installable, offline-capable PWA
- **Vitest + React Testing Library** — unit/component tests
- **Playwright** — end-to-end tests (desktop Chrome + iPhone viewport)
- **oxlint + Prettier** — linting and formatting
- **GitHub Actions** — CI on every push/PR: lint, format check, unit tests, build, E2E

## Local development

```
npm install
npm run dev
```

## Scripts

| Command                | Does what                         |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the Vite dev server         |
| `npm run build`        | Typecheck + production build      |
| `npm run lint`         | oxlint                            |
| `npm run format`       | Prettier, writes changes          |
| `npm run format:check` | Prettier, check only (used in CI) |
| `npm test`             | Vitest unit/component tests       |
| `npm run test:watch`   | Vitest in watch mode              |
| `npm run e2e`          | Playwright end-to-end tests       |

## Supabase setup

1. Create a Supabase project, then copy `.env.example` to `.env.local` and fill in the **Project URL** and **anon key** (Project Settings → API):
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
2. Run the migrations in `supabase/migrations/` **in order** via the Supabase SQL Editor: `0001_households.sql`, `0002_lists.sql`, `0003_items.sql`, `0004_list_items.sql`, then `0005_groups.sql`.
3. For CI to build and run E2E tests, add the same two values as GitHub Actions repository secrets (**Settings → Secrets and variables → Actions**).

## Testing on an iPhone

Since there's no Mac/Apple developer account involved, distribution is via the PWA install flow:
deploy to a free static host (Vercel/Netlify), open the URL in Safari on iPhone, then **Share → Add to Home Screen**.

## Build status

- ✅ Phase 1 — Vite/React/TS scaffold, PWA config, testing (Vitest + Playwright), CI pipeline
- ✅ Phase 2 — Supabase auth + household/sharing model
- ✅ Phase 3 — Lists screen + routing
- ✅ Phase 4 — Items catalog + drag-to-reorder ranking
- ✅ Phase 5 — Items on lists: add (from catalog or new), check off, swipe to remove, trolley/list totals, "start next shop"
- ✅ Phase 6 — Design system: Tailwind + shadcn/ui, every screen restyled
- ✅ Phase 7 — Groups (meals): create, rename, add/remove items, reachable from the nav (code complete; run `0005_groups.sql` per "Supabase setup" above to activate)
- ⏳ Phase 8+ — groups on lists, validation & polish pass, PWA/realtime polish (see project plan)
