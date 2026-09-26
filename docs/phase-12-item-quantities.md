# Phase 12: Multi-Select Catalog Modal & Item Quantities

**Goal of this phase:** the second post-launch fix. Adding items from the catalog to a list meant scrolling down to an inline list, adding one at a time, and there was no way to say "I need 2 of these" without adding the same item twice (which the app doesn't even allow — item names are unique per catalog, and a list can only hold one row per catalog item). This phase replaces that inline list with a proper multi-select modal, adds a real quantity to every list item, and moves the quick-add bar to a fixed position so it's reachable regardless of scroll position — the same "always reachable" principle Phase 11 applied to the catalog screens, now applied to the list-detail screen specifically.

Groups (`AddGroupToList`/`GroupSelectionPanel`) deliberately weren't touched this phase — a scope call made explicitly before writing any code, not an oversight.

---

## Step 1 — `quantity` is one column, not one row per unit

**What we did:** `supabase/migrations/0007_list_item_quantity.sql` adds `quantity integer not null default 1 check (quantity > 0)` to `list_items`. "2x Milk" is a single row with `quantity = 2`, not two separate rows for the same item.

**Why the database enforces `quantity > 0` rather than trusting the client:** the UI's own rule — press "-" at quantity 1 and the item is removed from the list entirely, not set to a phantom "0 of this" state — is exactly the kind of invariant worth having the database refuse to violate even if a future bug tried to. A `check` constraint means "quantity 0" is simply not a representable state, not just an avoided one.

**Why existing rows default to 1 rather than needing a backfill:** every list item that existed before this phase was, implicitly, "1 of that item" — nothing about past behavior changes for data that already exists, the column is just now making explicit what was always true.

---

## Step 2 — Totals become price × quantity, and what "unpriced" still means

**What we did:** `src/list-items/totals.ts`'s `listTotal`/`trolleyTotal` now multiply each line's price by its quantity before summing, via one small internal `lineTotal` helper shared by both.

**Why `unpricedCount` still counts line items, not units:** an unpriced "3x paper towels" flags the total as "+1 unpriced," not "+3 unpriced." The number is meant to answer "how many lines am I missing a price for," which is about how many products need a price added to your catalog — not about how many individual units are unaccounted for. Multiplying it by quantity would answer a question nobody was asking.

---

## Step 3 — The quantity stepper appears in two places, sharing one semantic

**What we did:** A `−`/count/`+` control now appears both on `ListItemRow` (for items already on the list) and inside the new catalog modal (for items being considered for it) — visually identical, but doing two different jobs underneath.

**On the list itself (`ListItemRow.tsx`):** every tap immediately persists — `+` increments and writes straight to the database, `-` decrements the same way, and specifically, pressing `-` at quantity 1 calls `onRemove` instead of writing `quantity: 0`, deleting the row (the DB constraint from Step 1 would reject a 0 anyway, but the UI never attempts it — this is the literal, explicit behavior asked for: "if there is only 1, pressing - will remove the item from the list"). This is optimistic-then-persisted, the same pattern every mutation in this app has used since Phase 5 — the row updates instantly, the network call happens after, and a failure falls back to `refresh()`.

**Inside the modal (`AddFromCatalog.tsx`):** quantity means something different — it's a draft count that only becomes real when you press the confirm button, not written anywhere until then. Nothing is selected to start (every item begins at 0); tapping `+` on an unselected item both selects it and sets it to 1 in the same action, and tapping `-` back down to 0 un-selects it again — there's no separate checkbox alongside the stepper, the stepper's own value _is_ the selection state. This was a deliberate simplification worth naming: it would be possible to track "is this selected" and "what quantity" as two separate pieces of state, but they never actually disagree with each other in practice (0 always means "not included," anything above 0 always means "included with this many") — so modeling them as one number rather than two synchronized values removes a whole category of "what if these get out of sync" bugs before they can exist.

---

## Step 4 — The modal itself: multi-select, not one-tap-at-a-time

**What we did:** `AddFromCatalog.tsx` was rewritten from an inline, always-visible list of "Add" buttons into a triggerable `Dialog` (the same primitive Phase 11 introduced) containing every catalog item not already on the list, each with its own quantity stepper, and a single footer button that reads `Add 3 items ($20.00)` — both the count and the running total computed live as you adjust quantities — which inserts every selected row in one bulk `insert` call and closes.

**Why one bulk insert instead of one insert per selected item:** the same reasoning `GroupSelectionPanel` already established in Phase 8 for adding a whole meal at once — one network round trip, and either everything you confirmed lands or nothing does, rather than a partial result if something fails partway through a sequence of individual inserts.

**Why the dialog content needs its own internal scroll region (`max-h-[80vh] overflow-y-auto`), unlike Phase 11's simpler dialogs:** Phase 11's add-item/add-list/add-group dialogs had a handful of fixed fields — they never needed to scroll. This one holds the user's entire remaining catalog, which could be dozens of items; without a bounded, independently-scrolling middle section, a long catalog would push the confirm button off the bottom of the screen entirely. The header and footer stay fixed in place, the item list scrolls between them — a layout shape this project hadn't needed until a modal held a genuinely open-ended amount of content.

---

## Step 5 — The quick-add bar becomes fixed, and why it lives inside the component itself

**What we did:** `QuickAddItem.tsx`'s existing form (unchanged — same validation, same two buttons, same "reuse an existing item on a duplicate name" fallback from Phase 5) is now wrapped in the same fixed-positioning technique `FloatingAddButton` established in Phase 11: a full-width `pointer-events-none` wrapper anchored above the tab bar, with the actual content centered inside a `max-w-[480px]` inner container so it aligns with the content column rather than the raw browser viewport.

**Why this lives inside `QuickAddItem.tsx` itself rather than being wrapped by `ListDetailPage`:** `QuickAddItem` is only ever used in one place — there's no reusability reason to keep its positioning separate from its content the way `FloatingAddButton` needed to be its own component (used identically across three different screens in Phase 11). A component that's used exactly once is allowed to own its complete presentation, including where it sits on the screen.

**Why `ListDetailPage`'s content needs extra bottom padding (`pb-56`) beyond what other screens use:** the shared `pb-36` in `Home.tsx` (set in Phase 11) was sized for a small floating button, not a multi-line card with an input and two buttons. Rather than growing that shared padding for every screen to accommodate this one page's taller fixed element, the extra clearance is scoped to this page specifically — the same "don't let one screen's specific needs leak into every other screen's layout" instinct as everything else about how these fixed elements were built self-contained.

---

## Verification run

`npm run lint` (still exactly the same two accepted warnings), `npm run format:check`, `npm test` (75 tests across 20 files — new dedicated test suites for `ListItemRow` covering the decrement-to-removal behavior specifically, and for `AddFromCatalog` covering the multi-select/quantity/bulk-insert flow, following the same "test the genuinely new logic directly" standard established since Phase 5; two unrelated tests timed out on one parallel run under system load and passed cleanly both in isolation and on a full clean re-run, confirming it was transient resource contention, not a regression), `npm run build`, and `npm run e2e` (unchanged — this feature lives entirely behind the auth/household gate).

**Visual verification, same discipline as Phase 11:** the actual risk here was layout, not logic — does the fixed bar clear the tab bar, does it overlap "Add from your items," does the modal's internal scroll region actually work, does the quantity math read correctly at a glance. Verified with the same temporary Supabase-client stub and Playwright screenshots technique as Phase 11 (never committed, restored byte-for-byte via `diff` immediately after), across the list-detail screen at rest, scrolled to its end, the empty modal, and the modal with quantities selected.

---

## What's required from you

Run `supabase/migrations/0007_list_item_quantity.sql` in the Supabase SQL Editor. Nothing else new.
