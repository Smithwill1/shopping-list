# Phase 13: Sink-to-Bottom Sorting, a Combined Fixed Stack, and a Keyboard Fix

**Goal of this phase:** three specific, unrelated complaints from actually using the app in-store, addressed independently:

1. "Add from your items" scrolled away with the list instead of staying reachable.
2. Checked-off items stayed in their rank position instead of moving out of the way, so the next thing to grab was never reliably at the top.
3. The on-screen keyboard covered the "add item" text box, hiding what you were typing.

None of these three touch each other's code — they're grouped into one phase because they landed in the same conversation, not because they're related.

---

## Step 1 — Checked items sink to the bottom, and why the sort had to move

**What we did:** `src/list-items/useListItems.ts` gained an exported `sortListItems` function — sort by `done` first (unchecked before checked), then by `rank` within each of those two groups:

```ts
export function sortListItems(items: ListItem[]): ListItem[] {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (a.rank ?? Infinity) - (b.rank ?? Infinity)
  })
}
```

**Why unchecking an item "just works" without any special-case code for it:** the sort has no memory of history — it only ever looks at an item's _current_ `done` and `rank`. Unchecking something doesn't need a "restore" step, because the same sort rule that put it at the bottom while checked places it straight back into rank order the moment `done` flips back to `false`. This is exactly the behavior asked for ("it will return to wherever its rank would place it originally") — and it falls out of the sort being stateless rather than needing to be built deliberately.

**Why this had to be called from `ListDetailPage.tsx` too, not just from the initial fetch:** the fetch-time sort alone would only reorder the list on the _next_ full refetch (a page reload, or a realtime event from your partner's device) — but toggling a checkbox updates local state optimistically (Phase 5's pattern) without refetching anything. Without re-sorting that same local update, the checkmark would flip instantly but the item wouldn't visibly move until something else happened to trigger a refresh — a noticeably laggy, inconsistent feel for the one interaction (checking things off) that happens most often during an actual shop. `toggleDone` and `startNextShop` (which flips every item back to unchecked at once) both now call `sortListItems` on their optimistic update, so the reorder is instant and consistent with everywhere else this app already updates immediately before the network confirms it.

---

## Step 2 — One fixed stack, not two independently fixed elements

**What we did:** the "Add from your items" trigger button moved out of the normal scrolling content and into the same fixed-position wrapper as the quick-add bar, stacked directly above it — both now live inside one `fixed` container in `ListDetailPage.tsx`, rather than `QuickAddItem` owning its own fixed positioning the way Phase 12 set it up.

**Why this meant undoing part of Phase 12's design, not just adding to it:** Phase 12 gave `QuickAddItem` its own self-contained fixed wrapper specifically because it was the only fixed element on the page at the time, and it was only ever used in one place — there was no reason to separate "what it is" from "where it sits." Once a second element needed to sit _directly above_ it as one visual unit, that reasoning stopped applying: two independently-fixed components can't reliably stack flush against each other without one hard-coding the other's height. Moving the positioning up to `ListDetailPage` — the one place that actually knows about both elements — let them share a single `flex flex-col` stack with a normal `gap`, which handles the spacing correctly regardless of either element's exact height.

**Why the page's bottom padding needed increasing again (`pb-56` → `pb-64`):** the fixed stack is taller now (an extra full-width button above the card), so the scrollable content needs proportionally more clearance to avoid the last item in a long list ending up hidden behind it — the same reasoning already documented in Phase 12 for why this padding lives on the page itself rather than in the shared layout.

---

## Step 3 — Anchoring dialogs near the top instead of centering them

**What we did:** `src/components/ui/dialog.tsx`'s `DialogContent` changed from `top-1/2 ... -translate-y-1/2` (vertically centered) to `top-[6vh]` (anchored near the top, horizontal centering unchanged). Also added `interactive-widget=resizes-content` to the viewport meta tag in `index.html`.

**Why a vertically-centered modal is specifically the wrong choice on a page that opens a keyboard:** mobile browsers — iOS Safari in particular — have a long-standing inconsistency in how `position: fixed` elements behave when the on-screen keyboard appears: the keyboard shrinks the _visible_ area from the bottom, but a fixed element centered against the _full_ layout viewport doesn't reliably re-center against the now-smaller visible area. The practical effect is a modal that was perfectly centered before the keyboard appeared ending up with its lower half — often including the very input you just tapped — pushed behind the keyboard. Anchoring near the top sidesteps the problem entirely: content close to the top of the screen stays within the visible area no matter how much of the bottom the keyboard covers.

**Why both a CSS fix and a viewport meta tag change, rather than just one:** they cover different browsers' behavior. `interactive-widget=resizes-content` is a newer, standardized hint that tells browsers supporting it to actually resize the visible viewport when the keyboard opens, which lets percentage/viewport-unit-based layouts (like `max-h-[80vh]` on the catalog modal from Phase 12) adjust correctly on their own. The `top-[6vh]` anchor is the fallback that works regardless of whether a given browser respects that hint — belt and braces, since this bug is specifically about inconsistent browser behavior rather than one clearly-specified standard.

**Why this fixes every dialog in the app, not just the one that was reported:** the bug was never really "the add-item dialog is positioned wrong" — it was "the shared `DialogContent` component centers vertically, which is the wrong default for any dialog containing a text input on a touch device." Fixing the shared component means the add-list, add-group, and add-from-catalog dialogs all get the same correction for free, without needing the same bug to be independently reported and fixed four more times.

---

## Verification run

`npm run lint` (still exactly the same two accepted warnings), `npm run format:check`, `npm test` (79 tests across 21 files — a new dedicated suite for `sortListItems` covering the sink-to-bottom/return-to-rank/stability behaviors directly), `npm run build`, and `npm run e2e` (unchanged).

**Visual verification, same discipline as Phases 11 and 12:** all three of this phase's changes were positional or interaction-timing risks that no amount of passing unit tests would actually confirm. Verified with the same temporary Supabase-client stub and Playwright screenshots (never committed, restored byte-for-byte via `diff` immediately after): the fixed stack's spacing with real content, an item's checkbox toggled and unchecked to confirm the sink/restore behavior visually, and the item dialog's new top-anchored position.

---

## What's required from you

Nothing — no schema changes this phase.
