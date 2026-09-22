# Phase 1: Project Foundation

**Goal of this phase:** turn the throwaway vanilla-JS prototype into a real React + TypeScript project, with testing, linting, and a CI pipeline already wired up — before a single feature (lists, items, groups) gets built. Everything below happened in this order; if you wanted to redo this phase from scratch, you could follow it top to bottom.

Nothing in this phase talks to a database yet. It's pure scaffolding: the goal is a project where `npm run build`, `npm test`, `npm run e2e`, and a GitHub Actions run all succeed on an app that does nothing yet — because it's much easier to add features to a skeleton that's already provably wired up correctly than to build features and tooling at the same time.

---

## Step 1 — Retire the prototype

**What we did:** Deleted `app.js`, `index.html`, `manifest.json`, `service-worker.js`, and moved the two icon files from `icons/` into `public/icons/`.

**Why:** The original app was hand-written vanilla JavaScript with no build step — fine for a weekend prototype, but it doesn't use React, TypeScript, or any of the tooling this project needs to demonstrate. Rather than trying to gradually convert it in place, it's cleaner to remove it and scaffold a proper project structure, then port over the pieces worth keeping (the icons, the colour scheme, the PWA meta tags).

**Why it matters here:** This was a deliberate decision made earlier in the project's planning (see the conversation/decision log) — the vanilla version was good enough to prove the concept but wouldn't showcase the React/TypeScript skills the project is meant to demonstrate for job applications. Because it was already committed to git, deleting it is completely safe — the old version is recoverable from git history any time (`git show 184ca51:app.js`, for example).

---

## Step 2 — Scaffold the project with Vite

**What we did:** Ran `npm create vite@latest <temp-folder> -- --template react-ts`, which generates a minimal, working React + TypeScript project, then merged its files into the repo.

**What Vite is:** Vite is a build tool for front-end projects. It does two jobs: (1) a **dev server** that serves your code to the browser near-instantly and updates the page the moment you save a file (no waiting for a full rebuild), and (2) a **bundler** that, when you're ready to ship, compiles all your TypeScript/JSX/CSS into a small number of optimised files a browser can run. `npm create vite@latest` is a scaffolding command — it asks (or, with flags, is told) what kind of project you want and generates a working starting point so you're not writing boilerplate by hand.

**Why React + TypeScript specifically:**
- **React** is a library for building UIs out of components — reusable pieces of interface (a `<ListItem>`, an `<AddItemForm>`) that manage their own state and re-render when that state changes. It's one of the most in-demand front-end skills in the job market you're targeting.
- **TypeScript** is JavaScript with a type system layered on top. It catches a whole class of bugs (passing the wrong shape of data into a function, misspelling a property name) at build time instead of at runtime, and it's effectively the industry default alongside React now — most React job postings assume it.

**Why it matters here:** This single command is what turns "a folder of HTML/JS files" into "a real front-end project" — everything else in this phase (testing, linting, CI) hangs off the structure Vite generates.

---

## Step 3 — Understand what Vite generated

Rather than treat the scaffold as a black box, here's what each generated file actually does:

- **`package.json`** — the project's manifest. It lists `dependencies` (code your app needs to *run*, e.g. `react`) versus `devDependencies` (tools you need only while *developing*, e.g. `vitest`, `typescript` — these never ship to the browser). It also defines `scripts`, which are named shortcuts to commands (`npm run build` instead of typing out `tsc -b && vite build` every time).
- **`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`** — TypeScript's configuration, split into three files on purpose. `tsconfig.json` is a small "root" file that just points at the other two. `tsconfig.app.json` configures how TypeScript checks your **browser** code (`src/**`). `tsconfig.node.json` configures how it checks `vite.config.ts` itself — which runs under **Node.js**, not the browser, and so needs slightly different rules (e.g. it can use Node's `import.meta` differently). Splitting them means each environment gets correct type-checking instead of one config awkwardly serving both.
- **`vite.config.ts`** — Vite's own configuration: which plugins to use, how to run tests, etc. (expanded in Step 7).
- **`index.html`** — in a Vite project, this *is* the real entry point (unlike older tooling where `index.html` was generated last). It contains `<script type="module" src="/src/main.tsx">`, which is what actually boots the app.
- **`src/main.tsx`** — the first JavaScript that runs. It finds the `<div id="root">` in `index.html` and tells React to render the `<App />` component into it, wrapped in `<StrictMode>` (a React development-mode helper that intentionally double-invokes some code to help you catch accidental side effects — it has no effect in production).

**Why it matters here:** You'll be editing these files constantly for the rest of the project — knowing why there are three `tsconfig` files instead of one, or why `index.html` matters in this setup, means future errors will make sense instead of feeling like magic.

---

## Step 4 — Restore branding and PWA meta tags

**What we did:** Rewrote `index.html`'s `<head>` and `src/index.css` to bring back the mobile-first styling, colour scheme, and PWA-specific meta tags from the original prototype; replaced the Vite demo `App.tsx` with a minimal placeholder.

**Why each meta tag exists:**
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` — tells mobile browsers to render at the phone's actual width rather than pretending to be a desktop page and zooming out (the default without this tag), and `viewport-fit=cover` lets the page draw behind the iPhone's notch/home-indicator safe areas.
- `<meta name="theme-color" content="#2f6f4f">` — the colour of the browser chrome (status bar, task switcher) when installed — a small polish detail that makes the installed app feel native.
- `<meta name="apple-mobile-web-app-capable" content="yes">` and `apple-mobile-web-app-status-bar-style` — iOS-specific tags that control how the app behaves once added to the home screen (full-screen "standalone" mode instead of opening inside Safari's UI chrome).
- `<link rel="apple-touch-icon" ...>` — the icon iOS uses specifically for the home-screen shortcut (separate from the favicon).

**Why it matters here:** This is a mobile-first PWA meant to be installed on two iPhones with no App Store involved — these tags are the entire mechanism by which "Add to Home Screen" produces something that looks and feels like a real app instead of a bookmark.

---

## Step 5 — Install the Supabase client library

**What we did:** `npm install @supabase/supabase-js`.

**What this command does:** `npm install <package>` downloads that package (and everything it depends on) into `node_modules/`, and adds it to `package.json`'s `dependencies` so anyone who clones the repo and runs `npm install` gets the exact same libraries.

**Why now, even though nothing uses it yet:** This is scaffolding ahead of Phase 2 (auth + shared data), not scope creep — the agreed build order put "Supabase project" as part of the foundation phase specifically so the wiring exists before the harder auth/data-model work starts. The library isn't imported anywhere yet, so it adds no behaviour and no risk; it's just available.

**Why it matters here:** `@supabase/supabase-js` is the client library that will talk to your Supabase project (Postgres database, authentication, and realtime sync) once that project exists in Phase 2.

---

## Step 6 — Install testing and tooling dependencies

**What we did:** One command installing eight packages as `devDependencies`:

```
npm install -D vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test prettier
```

| Package | What it's for |
| --- | --- |
| `vite-plugin-pwa` | Generates the PWA manifest and service worker automatically from config, instead of hand-writing them (which is what the original prototype did) |
| `vitest` | The test *runner* for unit/component tests — finds `*.test.tsx` files and runs them |
| `@testing-library/react` | Renders React components in a fake DOM so tests can interact with them the way a user would (click buttons, read text) rather than testing internal implementation details |
| `@testing-library/jest-dom` | Adds readable assertions like `.toBeInTheDocument()` on top of the basic ones |
| `@testing-library/user-event` | Simulates realistic user input (typing, clicking) more accurately than firing raw DOM events |
| `jsdom` | A JavaScript implementation of a browser's DOM, so component tests can run in Node.js without opening a real browser (fast, but not a substitute for real-browser E2E tests — see Step 9) |
| `@playwright/test` | The end-to-end testing framework — drives a real browser against the real built app |
| `prettier` | An opinionated code *formatter* — rewrites code to a consistent style automatically, so formatting is never a discussion or a diff-noise problem |

**Why it matters here:** Each of these is a distinct layer of the testing pyramid this project is meant to demonstrate: fast component tests (Vitest/RTL) for logic and rendering, slower but realistic end-to-end tests (Playwright) for whole user flows, and automated formatting so code review can focus on substance instead of style nits.

---

## Step 7 — Configure Vite (`vite.config.ts`)

**What we did:** Added the `VitePWA` plugin with a manifest configuration mirroring the old hand-written `manifest.json`, and added a `test` block for Vitest.

```ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
  manifest: { name: 'Shopping List', /* ...icons, colours, display mode... */ },
})
```

- `registerType: 'autoUpdate'` means when you ship a new version, the service worker updates itself in the background instead of requiring the user to manually clear it.
- The `manifest` object is compiled into `manifest.webmanifest` at build time — this is the file that tells the browser "this site can be installed," what it should be called, what icon to use, and what colour scheme to launch with.

The `test` block configures Vitest (which, notably, reuses this same Vite config file rather than needing a separate one):

```ts
test: {
  environment: 'jsdom',   // use the fake browser DOM described in Step 6
  setupFiles: ['./src/setupTests.ts'],
  globals: true,          // describe/it/expect available without importing them in every test file
}
```

**Why it matters here:** This one file is now the single source of truth for both "how the app is built" and "how the app is tested" — a deliberate Vite/Vitest design choice that avoids two configs drifting out of sync.

---

## Step 8 — Supabase client scaffold and typed environment variables

**What we did:** Created `src/lib/supabaseClient.ts`, `src/vite-env.d.ts`, and `.env.example`.

**`src/lib/supabaseClient.ts`:**

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars...')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

It deliberately **throws immediately** if the environment variables are missing, rather than silently continuing with `undefined` values. Why: a silent failure here would surface later as a confusing "network request failed" error deep inside some unrelated feature; failing loudly, immediately, with a message that says exactly what's missing and how to fix it, is far easier to debug.

**What a `.env` file is:** A plain text file of `KEY=value` pairs that holds configuration — and especially secrets (API keys, database URLs) — *outside* of your source code. The reason this matters: source code goes into git, which is often shared, public, or at minimum permanent history; secrets committed to git are effectively leaked forever, even if you delete them later, because they still exist in old commits. `.env` files let each developer (or each environment — local machine vs. production) have their own values without ever committing them.

- **`.env.example`** — committed to git. It lists which variables are *required* (`VITE_SUPABASE_URL=`, `VITE_SUPABASE_ANON_KEY=`) with empty/placeholder values, so anyone setting up the project knows exactly what they need to provide, without leaking real credentials.
- **`.env.local`** — where the *real* values go once you create a Supabase project. This file is gitignored (Step 10) and never committed.
- **The `VITE_` prefix is mandatory, not stylistic:** Vite only exposes environment variables prefixed with `VITE_` to your browser-side code — anything without that prefix stays server/build-only. This is a deliberate security boundary: it stops you from accidentally shipping a genuinely secret key (like a database admin key) into client-side JavaScript that anyone can read via the browser's dev tools. The Supabase "anon key" used here is specifically designed to be public-safe (it's paired with database security rules), which is why it's allowed to have the `VITE_` prefix.

**`src/vite-env.d.ts`:** A TypeScript *ambient declaration file* — it doesn't contain any real code, it just tells TypeScript "this shape of data exists somewhere at runtime." Vite injects environment variables onto `import.meta.env` when the app runs, but TypeScript has no way to know that on its own; this file declares `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as known, typed properties, so referencing them elsewhere in the code gets autocomplete and type-checking instead of TypeScript treating them as `any`.

**Why it matters here:** This is the exact boundary where Phase 2 will plug in real credentials — everything is ready to receive them, and the fail-fast check means the moment Phase 2 starts, any misconfiguration will announce itself clearly instead of causing mysterious bugs.

---

## Step 9 — Playwright configuration and the first end-to-end test

**What we did:** Added `playwright.config.ts` and `e2e/app.spec.ts`.

**Unit tests vs. end-to-end (E2E) tests — the distinction matters:** A unit/component test (Vitest + Testing Library, Step 6) renders a component in a *simulated* DOM inside Node.js — fast, but it never proves the app actually works in a real browser, talks to a real network, or survives real CSS/layout. An E2E test (Playwright) launches an actual browser engine, loads the actual built app, and drives it exactly the way a person would — closer to the truth, but slower. A solid testing setup uses both: lots of fast unit tests for logic, and a smaller number of E2E tests for the critical user journeys.

**`playwright.config.ts` key parts:**
```ts
webServer: {
  command: 'npm run build && npm run preview',
  url: 'http://localhost:4173',
  reuseExistingServer: !process.env.CI,
},
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
],
```
- `webServer` means Playwright automatically builds the app and starts a local server before running tests, and tears it down after — you never have to remember to start a dev server manually before running E2E tests.
- Two `projects` means every E2E test runs twice: once simulating a desktop Chrome browser, once simulating an iPhone 13's screen size and touch input. Since this app is explicitly mobile-first and meant to live on two iPhones, testing against a phone-shaped viewport isn't optional polish — it's the primary target device.

**`e2e/app.spec.ts`** is deliberately trivial right now — it just confirms the app loads and shows its heading. It exists to prove the entire pipeline (build → serve → real browser → assertion) works end to end before any real feature exists, the same "prove the skeleton works before adding muscle" logic as the rest of this phase.

**Why it matters here:** Later phases will add E2E tests for real flows (create a list, add an item, swipe to remove) — those tests will run inside this same harness, against both a desktop and a phone viewport, automatically, on every push.

---

## Step 10 — Update `.gitignore`

**What we did:** Expanded `.gitignore` to cover build output and test artifacts, not just `node_modules/`.

**What `.gitignore` does:** It's a plain list of file/folder patterns that git should never track, even if they exist on disk. Anything matching a pattern in it won't show up in `git status`, won't get accidentally `git add`ed, and won't end up in the repository.

**What was added and why:**
- `dist/`, `dist-ssr/` — the build *output*. It's regenerated from source every time you run `npm run build`, so committing it would just be redundant, noisy, and a source of merge conflicts.
- `.env`, `.env.local`, `.env.*.local` — the secrets discussed in Step 8. This is the single most important line in the file: it's the safety net that stops a real Supabase key from ever being committed by accident.
- `/coverage`, `/playwright-report/`, `/test-results/`, `/blob-report/` — generated test output/reports, same reasoning as `dist/` — regenerated on demand, not source.

**Why it matters here:** A `.gitignore` isn't bureaucracy — the `.env` lines in particular are a real security control, not a formality.

---

## Step 11 — GitHub Actions CI workflow

**What we did:** Created `.github/workflows/ci.yml`.

**What CI is:** "Continuous Integration" means every change is automatically built and tested the moment it's pushed, rather than trusting that it works because it ran on one person's machine. **GitHub Actions** is GitHub's built-in system for running these automated jobs — it watches for events (like a push) and runs whatever you've configured in response, on GitHub's own servers.

**What YAML is, and why this file has to be exactly where it is:** YAML is a plain-text data format (like JSON, but designed to be more human-readable) used heavily for configuration files. It represents structure using indentation rather than braces/brackets, which means indentation is *meaningful* — an extra or missing space changes what the file means, unlike most programming languages where whitespace is cosmetic. GitHub Actions specifically requires workflow files to live at `.github/workflows/*.yml` in the repo — that exact path is how GitHub discovers them; there's no configuration step to point it elsewhere.

**Walking through the file:**
```yaml
on:
  push:
    branches: [main]
  pull_request:
```
This says: run this workflow whenever someone pushes to `main`, *and* whenever a pull request is opened or updated against any branch. The PR trigger matters most in practice — it's what lets you (or anyone reviewing a PR) see "tests pass" or "tests fail" directly on the PR, before merging.

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: 22, cache: npm }
  - run: npm ci
```
`checkout` pulls the repo's code onto the runner (a fresh, temporary virtual machine — nothing persists between runs, which is why nothing here is installed by hand ahead of time). `setup-node` installs the exact Node version needed and caches `node_modules` between runs for speed. `npm ci` (as opposed to `npm install`) installs *exactly* what's in `package-lock.json`, byte-for-byte — the right choice for CI, where you want a fully reproducible install, not "whatever the latest compatible version happens to be today."

Then the actual checks, deliberately ordered **cheapest and fastest first:**
```yaml
- run: npm run lint          # seconds
- run: npm run format:check  # seconds
- run: npm test               # tens of seconds
- run: npm run build          # includes a full TypeScript check
- run: npx playwright install --with-deps chromium webkit
- run: npm run e2e            # slowest — real browsers, real app
```
This ordering means a trivial mistake (a formatting issue, a lint error) fails the build in seconds rather than after waiting minutes for browsers to download and E2E tests to run — fast feedback is a real value here, not just tidiness.

```yaml
- name: Upload Playwright report
  if: always()
  uses: actions/upload-artifact@v4
  with: { name: playwright-report, path: playwright-report/ }
```
`if: always()` means this step runs even if a previous step failed — specifically so that when E2E tests fail, you get the actual Playwright HTML report (screenshots, traces) as a downloadable artifact on the failed run, instead of just a red X with no way to see what went wrong.

**Why it matters here:** This is the actual centrepiece of the "automation showcase" side of the project — a green checkmark on every push isn't just reassurance, it's the artifact that demonstrates the CI/CD skill this project exists partly to prove.

---

## Step 12 — Update the README, then verify before calling it done

**What we did:** Rewrote `README.md` to describe the new stack, scripts, and current phase status. Then, before considering Phase 1 finished, ran every check the CI pipeline will run — locally, one at a time — and confirmed each one passed: `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run e2e`.

**Why verify locally before pushing:** This is the same discipline CI enforces, just done by hand first. As a tester moving into automation, this is worth internalising as a habit independent of any tool: never assume a change works — prove it, the same way an automated pipeline would, before calling something finished. It also means the *first* real CI run on this repo should be a formality confirming what's already known, not a surprise.

**Why it matters here:** A README that accurately describes the current state of the project (including what's *not* done yet) is part of what makes a repo look professionally maintained rather than abandoned mid-thought — again, relevant to the showcase goal.

---

## Step 13 — Commit and push

**What we did:** `git add -A`, reviewed `git status` to confirm exactly the expected files were staged (no `node_modules/`, no `dist/`, no `.env.local`), committed with a message describing *why* the change exists, then `git push origin main`.

**Why review `git status` before committing:** A broad `git add -A` stages *everything* not gitignored — reviewing the list before committing is the check that catches a `.gitignore` mistake (something secret or generated sneaking in) before it becomes a permanent part of git history, rather than after.

**Why the commit message explains "why," not just "what":** The diff itself already shows *what* changed line by line; a good commit message adds the *why*, which the diff can never show — useful to your future self, and to anyone reviewing this project's history as part of a portfolio.

**Why it matters here:** Pushing to `origin/main` is also what triggers the CI workflow from Step 11 for the first time — this step and Step 11 are directly connected.

---

## Quick reference: every new file and its purpose

| File | Purpose |
| --- | --- |
| `package.json` / `package-lock.json` | Project manifest and exact dependency versions |
| `vite.config.ts` | Build tool config: plugins (React, PWA), test runner config |
| `tsconfig*.json` | TypeScript checking rules, split by environment (app vs. Node config) |
| `index.html` | The real app entry point; PWA meta tags |
| `src/main.tsx` | Boots React into the page |
| `src/App.tsx` | Root component (placeholder for now) |
| `src/index.css` | Global styles, colour theme (light/dark) |
| `src/vite-env.d.ts` | Types the custom environment variables |
| `src/lib/supabaseClient.ts` | Pre-wired Supabase connection, ready for Phase 2 |
| `.env.example` | Documents required environment variables without leaking real values |
| `src/setupTests.ts` | One-time test environment setup (loads jest-dom matchers) |
| `src/App.test.tsx` | First unit/component test |
| `playwright.config.ts` | E2E test runner config (builds app, runs against 2 device profiles) |
| `e2e/app.spec.ts` | First end-to-end test |
| `.oxlintrc.json` | Linter rules |
| `.prettierrc.json` / `.prettierignore` | Formatter rules and exclusions |
| `.gitignore` | What git should never track (build output, secrets, test artifacts) |
| `.github/workflows/ci.yml` | The automated pipeline that runs all of the above on every push/PR |

---

## Deliberately not done in this phase

- No real Supabase project exists yet, and nothing in the app calls `supabase` — that starts Phase 2.
- No deploy target (Vercel/Netlify) is connected — the app isn't reachable at a URL yet.
- No app features exist — `App.tsx` is a placeholder heading, on purpose, so this phase could be verified in isolation from any feature risk.
