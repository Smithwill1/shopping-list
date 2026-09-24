# Phase 6: Design System

**Goal of this phase:** turn a functionally-complete but visually bare app into something that looks and feels like a real, native-adjacent iPhone app — without touching any of the behavior built in Phases 1–5. Every screen from auth through list detail gets restyled in this phase, using a consistent set of tokens and components, before Phase 7 (groups/meals) builds anything new on top of it.

This phase was deliberately slotted in _here_ rather than at the start or the end — see the "when to apply styling" discussion that preceded it. With auth, households, lists, items, and list-items all built, every recurring UI pattern this app will ever need (a form, an empty state, a card list, a row with an action) already exists in real, working code. Styling now means every pattern gets solved once; anything built from Phase 7 onward inherits it automatically.

---

## Step 1 — Choosing the stack: Tailwind + shadcn/ui

**What we did:** Installed Tailwind CSS v4 and initialized shadcn/ui, rather than hand-writing more CSS in the style of Phase 1's `index.css`.

**Why Tailwind:** Utility classes written directly in JSX (`className="flex items-center gap-3"`) instead of separate stylesheets. It's close to ubiquitous in current React job listings, and pairs naturally with component-driven development — the styling for a piece of UI lives right next to the markup it styles, rather than in a separate file you have to keep in sync by hand.

**Why shadcn/ui specifically, instead of a conventional component library (MUI, Chakra, Mantine):** shadcn/ui isn't a package you install and import from — running `npx shadcn add button` _copies the component's source code_ into `src/components/ui/`, built on Radix UI primitives underneath for accessibility (keyboard navigation, focus management, ARIA attributes) that would be easy to get subtly wrong hand-rolling it. Because the code lives in this repo, it can be freely edited to fit this app's exact needs rather than fighting a library's opinions, and it reads as "I understand and own this code," not "I imported someone else's design."

**Why this pairing over plain CSS with a hand-built token system (the lighter-weight alternative that was on the table):** Plain CSS gives full control but is slower to reach a polished result without dedicated design skill, and doesn't carry the same signal about current, in-demand tooling. Given this project's dual purpose — a real app _and_ a portfolio piece — the faster path to a genuinely good-looking result that also demonstrates a current, real-world stack won out.

---

## Step 2 — Wiring it into a Vite + React project

**What we did:** `npm install tailwindcss @tailwindcss/vite`, added the plugin to `vite.config.ts`, then ran `npx shadcn@latest init`.

**The `@` import alias:** shadcn's generated components import each other and shared utilities using `@/components/ui/button` rather than long relative paths like `../../components/ui/button`. This needed two things wired up: `paths: { "@/*": ["./src/*"] }` in `tsconfig.app.json` (and the root `tsconfig.json`, for tooling that reads it directly) so TypeScript understands the alias, and a matching `resolve.alias` entry in `vite.config.ts` so the actual bundler resolves it the same way. Both have to agree, or TypeScript is happy while the dev server 404s, or vice versa.

**A small deprecation fix along the way:** TypeScript's `tsc -b` flagged `baseUrl` as deprecated (removed in TS 7.0) the moment it was added alongside `paths`. Under this project's `moduleResolution: "bundler"` setting, `paths` alone resolves correctly relative to the tsconfig file without needing `baseUrl` at all — so it was simply left out, rather than suppressed with `ignoreDeprecations`.

**Getting the CLI to run non-interactively:** `shadcn init`'s default flags assume a Next.js project and prompt interactively for a color preset. Getting a clean, scriptable run needed explicit flags: `-t vite -b radix -p nova -y --force` (Vite template, Radix as the primitive library, the "Nova" preset, skip confirmations). Worth knowing if this project's tooling versions move on and the exact flags drift — the underlying need (non-interactive init, told explicitly which framework/preset to use) will still apply.

**Dependency hygiene:** the init command added `tailwindcss`, `@tailwindcss/vite`, and the `shadcn` CLI itself to `dependencies` — all three are build-time-only tools that never ship to the browser, so they were moved into `devDependencies` by hand afterward, consistent with the distinction Phase 1's docs already draw between the two.

---

## Step 3 — The palette: mapping "iOS-Native Fresh" onto shadcn's token names

**What we did:** shadcn/ui themes entirely through CSS custom properties with standardized names (`--background`, `--primary`, `--card`, `--border`, and so on) — every component it generates references these names, never a hard-coded color. Rewriting `src/index.css` to define this app's chosen palette under those exact names means every current and future shadcn component picks up the theme automatically, with zero per-component styling needed.

```css
:root {
  --background: #f5f5f0; /* warm off-white, unchanged from Phase 1 */
  --primary: #2f6f4f; /* the original forest-green accent, unchanged */
  --primary-foreground: #ffffff;
  --radius: 1rem; /* drives every rounded-* utility app-wide */
  /* ...and so on for card/muted/accent/destructive/border/input/ring */
}
```

Two things were deliberately **kept** from the Phase 1 palette rather than replaced: the green accent (`#2f6f4f`) and the warm off-white background (`#f5f5f0`) — this is a restyle of the same app, not a rebrand, and both were already reasonable choices. A `prefers-color-scheme: dark` block mirrors the same token names with the dark-mode values already established in Phase 1.

**Why `--radius: 1rem` matters beyond just "rounder corners":** shadcn's `@theme inline` block derives `--radius-sm`/`-md`/`-lg`/`-xl` as fractions and multiples of this one variable, and every generated component (`Card`, `Button`, `Input`) is written using those derived utilities, never a hard-coded radius. Changing one number changes the roundedness of every component in the app at once — which is exactly the large-rounded-corners, native-iOS feel the "iOS-Native Fresh" direction asked for, achieved as a single token rather than a find-and-replace across every component.

**Why the system font stack, not shadcn's default web font:** The init command pulled in `@fontsource-variable/geist`, a bundled, downloaded font. For an app whose whole premise is "installed on an iPhone," `-apple-system, BlinkMacSystemFont, ...` (already the font stack from Phase 1) is the _better_ choice specifically because it costs nothing to download and, on an actual iPhone, resolves to genuine San Francisco — the real native system font — for free. The Geist package was removed after confirming this.

---

## Step 4 — Applying it: every existing screen, restyled

**What we did:** Went through every component built in Phases 1–5 — `AuthScreen`, `CreateOrJoinHousehold`, `InvitePanel`, `ListsScreen`, `ListDetailPage`, `ItemsScreen`, `ItemRow`, `ListItemRow`, `AddFromCatalog`, `QuickAddItem`, and the `Home` shell — replacing raw `<button>`/`<input>`/`<label>` elements with shadcn's `Button`/`Input`/`Label` (and `Card`/`Separator`/`Checkbox` for structure), and adding Tailwind utility classes for layout and spacing.

**What _didn't_ change in any of these files:** the state management, the Supabase calls, the validation logic, the RLS-dependent data flow — none of it. This was strictly a markup-and-class-level pass. That every existing test (component tests mocking Supabase, the unit tests for validation/rank/totals) needed only two one-line text fixes across the whole restyle (see Step 6) is itself a demonstration of why logic was pushed into pure, UI-independent functions throughout Phases 2–5: the visual layer changed completely, and the tested logic layer didn't need to change at all.

**The app shell (`Home.tsx`):** replaced the plain top links with a translucent, blurred, sticky header (page title + household name + icon buttons for invite/sign-out) and a fixed bottom tab bar (`react-router-dom`'s `NavLink`, styled to highlight the active tab, with `env(safe-area-inset-bottom)` padding so it clears the iPhone's home-indicator bar). A bottom tab bar is one of the more recognizable signatures of native iOS navigation, and now that there are exactly two real destinations (Lists, Items), it was worth building as one rather than leaving plain text links.

**One small genuinely new component:** `src/components/PageLoading.tsx` — a centered spinner, replacing five separate hand-written `<p>Loading…</p>` instances scattered across `App.tsx`, `ListsScreen.tsx`, `ItemsScreen.tsx`, and `ListDetailPage.tsx`. This isn't a styling-only change so much as noticing, while restyling, that the same three words were duplicated five times with no shared component behind them — worth consolidating on sight, the same instinct that led to extracting `useAsyncData` in Phase 4.

---

## Step 5 — A semantic bug the tests caught: `CardTitle` isn't a heading

**What we did:** shadcn's generated `CardTitle` component renders a plain `<div>`, not an `<h1>`–`<h6>` element — a deliberate choice in the shadcn source, presumably so a card title can sit at whatever heading level makes sense for its context without the component forcing one. Using it directly for this app's actual page titles (the "Sign in" / "Create an account" heading, "Get started") broke three existing tests that queried `getByRole('heading', { name: /sign in/i })`.

**Why this was fixed at the source rather than by loosening the tests:** The test failure was a real, correct signal — a page missing a proper heading is a genuine accessibility regression (screen readers rely on the heading hierarchy to navigate a page's structure), not just a testing inconvenience. The fix was to stop using `CardTitle` for anything that functions as an actual page or section title, and use a real `<h2>`/`<h3>` styled to match instead:

```tsx
<h2 className="text-xl font-medium leading-snug">
  {mode === 'sign-in' ? 'Sign in' : 'Create an account'}
</h2>
```

This is a good example of what test coverage is actually _for_ in a restyle: nothing here was about business logic, but the existing tests still caught a real defect the moment it was introduced, before it ever reached a real user or a screen reader.

---

## Step 6 — What the tests needed changed, and why so little

**What we did:** Two one-line fixes, both in the same shape — `ListsScreen.test.tsx` and `ItemsScreen.test.tsx` each asserted a button's accessible name matched `/\+ new list/i` / `/\+ new item/i`. Restyling replaced the literal `+` character in the button text with a `lucide-react` plus icon (`<Plus className="size-4" />` next to the word "list"/"item"), so the icon now carries that meaning visually instead of a text character — the regex was loosened to `/new list/i` / `/new item/i` to match.

**Why this counts as a good outcome, not a gap:** Out of 46 tests across the whole app, exactly two needed a one-line change, and both were style-of-assertion issues (matching literal button text) rather than the tests being wrong about behavior. That's the payoff of the testing approach established from Phase 2 onward — assert on accessible roles, labels, and visible text rather than DOM structure or CSS classes, so a visual overhaul this size doesn't ripple into the test suite.

---

## Step 7 — Visual verification, honestly scoped

**What we did:** Since there's no way for this session to click through the app in a real browser interactively, `npm run build` + `npm run preview` was started locally, and Playwright (already in the project for E2E) was used to actually screenshot the sign-in and sign-up screens, in both light and dark mode, at an iPhone-width viewport — then the screenshots were read and visually reviewed before calling this phase done.

**Why only those two screens got a real screenshot:** Every other screen (lists, items, list detail, household creation) requires a real authenticated session to reach. Creating one to screenshot would mean either using real account credentials (not something to do on someone else's behalf without being handed them) or creating a disposable throwaway Supabase account — which Phase 2's docs already ruled out as a practice for exactly this app, since there's no way to delete an `auth.users` row without dashboard or `service_role` access, leaving a permanent artifact in the real project. The honest position: the sign-in/sign-up screens were visually verified directly; every other screen uses the exact same `Card`/`Button`/`Input`/`Label` primitives with the same Tailwind classes, which is strong evidence of visual consistency but isn't the same as having actually looked at it. Worth taking a look yourself via `npm run dev` once you're signed in, the same spirit as the honestly-flagged test-coverage gaps in earlier phases.

---

## Verification run

`npm run lint` (the same two accepted warnings as before — the `useAsyncData` set-state-in-effect trade-off from Phase 4, plus shadcn's own vendored `Button` component exporting both a component and its `cva` variants function, which is standard, ecosystem-wide shadcn convention and not something to "fix" in code that gets regenerated by the CLI), `npm run format:check`, `npm test` (46 tests, unchanged in count — this phase added no new logic, only restyled existing UI), `npm run build`, and `npm run e2e` (2 tests, unchanged). Plus the manual screenshot-based visual check in Step 7.

---

## What's required from you

Nothing new to run against Supabase this phase — no schema changes. Worth running `npm run dev` yourself and clicking through the authenticated screens (lists, items, a list detail page) to confirm they look right, since that's the one thing this session couldn't verify directly (Step 7).
