# Shopping List

A shared, mobile-first shopping list PWA for two accounts to manage together — built as both a real app and a showcase project for test automation and CI/CD.

## Stack

- **React + TypeScript + Vite** — app shell
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

| Command               | Does what                                  |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                   |
| `npm run build`        | Typecheck + production build                |
| `npm run lint`         | oxlint                                       |
| `npm run format`       | Prettier, writes changes                    |
| `npm run format:check` | Prettier, check only (used in CI)           |
| `npm test`             | Vitest unit/component tests                 |
| `npm run test:watch`   | Vitest in watch mode                        |
| `npm run e2e`          | Playwright end-to-end tests                 |

## Supabase setup

The app expects a Supabase project. Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

(Project not yet created — this lands in Phase 2 along with auth and household/sharing.)

## Testing on an iPhone

Since there's no Mac/Apple developer account involved, distribution is via the PWA install flow:
deploy to a free static host (Vercel/Netlify), open the URL in Safari on iPhone, then **Share → Add to Home Screen**.

## Build status

- ✅ Phase 1 — Vite/React/TS scaffold, PWA config, testing (Vitest + Playwright), CI pipeline
- ⏳ Phase 2 — Supabase auth + household/sharing model
- ⏳ Phase 3+ — lists, items, groups, drag-to-rank, trolley totals (see project plan)
