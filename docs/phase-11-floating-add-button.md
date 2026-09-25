# Phase 11: Floating Add Button & Modal Forms

**Goal of this phase:** the first piece of work outside the original 10-phase plan — a real usage complaint after the app was actually being used, not a requirement drafted up front. The original "+ New X" button sat at the top of each catalog screen (Lists, Items, Groups), and its form appeared inline at the _bottom_ of the list. As a list grows, adding another item means scrolling up to find the button, then scrolling back down to find the form you just opened — the exact opposite of what a "quick add" action should feel like.

---

## Step 1 — What actually changed, and what didn't

**What we did:** Replaced the top-of-screen "+ New X" button and inline Card form, on all three catalog screens (Lists, Items, Groups), with a floating "+" button fixed to the bottom-right of the screen, and a modal dialog for the create form.

**What deliberately did NOT change:** the actual add logic — validation, the Supabase insert call, error handling (including the friendly duplicate-name messages from Phase 9) — none of it moved or changed shape. Item editing (the pencil icon on each row in `ItemRow`) and group renaming (`GroupDetailPage`) also weren't touched; neither had a scrolling problem, since you tap directly on the row you're already looking at. This was a placement-and-presentation fix, not a logic rewrite — which is why it touched three screen components and nothing underneath them.

---

## Step 2 — Why a shared `FloatingAddButton`, not three separate ones

**What we did:** `src/components/FloatingAddButton.tsx` — one component, taking just a `label` and an `onClick`, used identically by `ListsScreen`, `ItemsScreen`, and `GroupsScreen`.

**Why this one was extracted immediately, with no "wait for a third repetition" hesitation the way `useAsyncData` was in Phase 4:** the button's appearance and position had to be pixel-identical across all three screens for the "this is where + always lives" mental model to actually hold — if the button drifted a few pixels between screens, or used different sizing, it would stop feeling like one consistent, reliable landmark and start feeling like three separate buttons that happen to look similar. That's a case where the shared component _is_ the feature, not just a convenience.

**A positioning detail worth explaining — why the button doesn't just use `fixed bottom-4 right-4`:** the app's content is centered in a `max-w-[480px]` column (set in `index.css` back in Phase 1), but a plain `fixed ... right-4` would anchor the button to the actual browser window's edge — correct on an iPhone, where the viewport _is_ the content width, but visibly detached from the content column on a wider screen (like a desktop browser during development). The fix is the same technique the bottom tab bar (`Home.tsx`, Phase 7) already uses: a full-width `fixed inset-x-0` wrapper with `pointer-events-none`, containing an inner `mx-auto max-w-[480px] relative` element that the button is positioned `absolute` within. The button ends up aligned to the content column's right edge on any screen width, not the raw viewport's.

---

## Step 3 — The modal, and why shadcn's Dialog was the right tool without writing anything custom

**What we did:** Added shadcn's `Dialog` component (`npx shadcn add dialog`) — built on Radix's Dialog primitive — and wrapped each screen's existing create form in `DialogContent`, triggered by the floating button's `onClick` instead of a toggled boolean showing an inline `Card`.

**Why this satisfies "can't interact with the list while the modal is displayed" with no code written for it:** Radix's Dialog renders a full-screen overlay behind the modal content and traps keyboard focus inside it while open — clicking or tapping anything behind the overlay does nothing, and Tab-ing through fields never escapes to the list underneath. This is exactly the requirement, and it came from choosing the primitive rather than building the behavior by hand — the same reasoning as choosing shadcn/ui at all back in Phase 6.

**Dismissal is built in too:** Esc, clicking the overlay, or the corner close button (rendered by `DialogContent` automatically) all close it — "you either add the item or dismiss the modal" was Radix's default behavior, not something to implement.

**One real bug this surfaced — Radix's `Title` isn't the same trap as shadcn's `CardTitle` (Phase 6), but it was worth checking:** Phase 6 found that shadcn's `CardTitle` renders a `<div>`, not a heading, which broke tests expecting `role="heading"`. Before using `DialogTitle` the same way here, its actual output was checked directly in `node_modules` rather than assumed: Radix's `Dialog.Title` renders a real `Primitive.h2`. No bug this time, but checking rather than assuming is the same habit that caught the real one.

---

## Step 4 — A scope decision beyond the literal bug report: one add affordance, not two

**What we did:** The empty state on each screen ("No items yet.") no longer has its own "Create your first X" button — just text pointing at the floating button ("Tap + to add one."). Previously, the empty state's big button and the populated state's small button were two different-looking triggers for the identical action.

**Why this changes Req-01/08/09's letter slightly, and why that's the right call here:** The original requirements (written before any of this existed) described a big button in the empty state and a smaller one once content exists — two states, two button treatments. Once there's a single floating button always on screen regardless of state, keeping a second, separate button in the empty state would mean two different ways to do the exact same thing, on the same screen, which is worse UX than either option alone — and directly contradicts what was just asked for ("clear... but not obtuse and not in the way"). One consistent affordance, explained by empty-state copy rather than duplicated by an empty-state button, better serves the actual intent behind the original requirement than following its literal button-count would.

---

## Verification run

`npm run lint` (still exactly the same two accepted warnings from every prior phase), `npm run format:check`, `npm test` (67 tests — each screen's test suite updated for the new dialog-based flow rather than the old inline-form one; the assertions changed shape, but the same behaviors are covered: empty state, the add button always present, the dialog opening, and validation blocking a bad submission), `npm run build`, and `npm run e2e` (unchanged).

**A verification step beyond the usual:** since the actual risk here was entirely visual/positional (does the button clear the tab bar, does it overlap list content, does the modal actually block the background), code review and passing tests weren't enough to trust on their own. The real running app was rendered with a temporary Supabase client stub (fake session, fake household, fake data for each screen — never committed, restored byte-for-byte via `diff` immediately after) and screenshotted with Playwright at an iPhone viewport width, across all three screens and the open dialog, before calling this done.
