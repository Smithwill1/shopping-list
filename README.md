# Shopping List

A shared, mobile-first shopping list PWA for two accounts to manage together — built as both a real app and a showcase project for test automation and CI/CD.

## Stack

- **React + TypeScript + Vite** — app shell
- **Tailwind CSS + shadcn/ui** — styling and UI primitives ("iOS-Native Fresh" theme)
- **Supabase** — auth, database, realtime sync (auth/database from Phase 2, realtime subscriptions from Phase 10)
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
2. Run the migrations in `supabase/migrations/` **in order** via the Supabase SQL Editor: `0001_households.sql`, `0002_lists.sql`, `0003_items.sql`, `0004_list_items.sql`, `0005_groups.sql`, then `0006_realtime.sql`.
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
- ✅ Phase 7 — Groups (meals): create, rename, add/remove items, reachable from the nav
- ✅ Phase 8 — Groups on lists: add a whole group to a list, pre-selected with deselect/confirm (no new migration — reuses existing schema/RLS)
- ✅ Phase 9 — Validation & polish: shared validation/error-formatting helpers, fixed three silently-swallowed insert errors (no new migration)
- ✅ Phase 10 — PWA & realtime polish: live sync on lists/list_items, an offline indicator, a real bug fix in `useAsyncData` (run `0006_realtime.sql` per "Supabase setup" above to activate) — **deploy to Vercel/Netlify still needed, see below**

This closes out every phase in the original plan.

## Deploying (not yet done)

No deploy target is connected yet — this needs your account, not code. Both hosts' config is already in the repo (`vercel.json` for Vercel, `public/_redirects` for Netlify):

1. Sign in to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com) (GitHub OAuth is easiest) and import this repo.
2. Set the build command (`npm run build`) and output directory (`dist`) if not auto-detected.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the host's project settings, same values as `.env.local`.
4. Deploy, then open the given URL on an iPhone in Safari and **Share → Add to Home Screen**.
