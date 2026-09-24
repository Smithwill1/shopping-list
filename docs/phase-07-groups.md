# Phase 7: Groups (Meals)

**Goal of this phase:** a reusable catalog of item bundles — Req-06's example is "a group called Pizza contains four items: bases, sauce, pepperoni, cheese" — viewable from the base screen (Req-09) and manageable: rename, add/remove items (Req-11). Adding a whole group to a shopping list in one action is Phase 8, not this one — this phase only builds the standalone catalog of groups, the same relationship Phase 4 (items catalog) has to Phase 5 (items on lists).

This is also the first phase built under the standing instruction from Phase 6: styled from the start, not restyled afterward. Every screen below uses the same `Card`/`Button`/`Input`/`Label`/`Separator` primitives and Tailwind classes established in Phase 6, applied as the screens were written rather than retrofitted.

---

## Step 1 — Why `group_items.item_id` is NOT nullable (unlike `list_items`)

**What we did:** Two new tables — `groups` (household-scoped, unique name per household, same shape as `items`) and `group_items` (a join table between `groups` and `items`), with `item_id` required, not optional.

**Why this is the opposite design decision from Phase 5's `list_items`:** Phase 5 deliberately made `list_items.item_id` nullable, because Req-05 explicitly asked for an "add to list only, don't save to my catalog" path. Req-06 asks for nothing like that — its own example (bases, sauce, pepperoni, cheese) is entirely catalog items, and nothing in the requirements describes typing a brand-new, not-yet-catalogued item while building a group. So `group_items.item_id` is `not null`: a group is always built by selecting from the existing catalog. If an item a group needs doesn't exist yet, the flow is to add it to the catalog first (the Items screen, Phase 4), then add it to the group — a deliberate scope boundary, not a missing feature, and worth stating plainly rather than quietly reusing Phase 5's nullable pattern out of habit.

**Why `group_items` gets a `unique (group_id, item_id)` constraint:** Prevents the same item being added to the same group twice — the database-level equivalent of the "no duplicates" validation principle used for item and group names elsewhere, applied here to group membership instead of a name.

**Why `group_items` needs a delete policy (like `list_items`, unlike `items` or `lists`):** Req-11 explicitly asks for removing items from a group, so — following the same rule Phase 5 established (a delete policy exists only when a stated requirement needs it) — this is the third table to get one, and for the same reason as the first.

---

## Step 2 — The groups catalog screen, and why it looks almost identical to `ItemsScreen`

**What we did:** `GroupsScreen.tsx` — empty state with a prominent "Create your first group" button, or existing groups in a card list with a smaller "+ New group" button, each row linking to `/groups/:id`.

**Why this file reads as a near-duplicate of `ListsScreen.tsx`/`ItemsScreen.tsx`:** Because it structurally is one — Req-09's "view from the base screen, empty state has a create CTA" is the exact same shape as Req-01 (lists) and Req-08 (items), and rather than invent a different pattern for the sake of being different, the same proven layout gets reused. This is a deliberate trade-off worth naming: three screens this similar are a candidate for a shared generic component (a `<CatalogScreen>` taking a fetch hook, an insert function, and a row renderer), but that abstraction wasn't built. Unlike `useAsyncData` in Phase 4 — extracted after the exact same _logic_ repeated three times — this repetition is in _JSX layout_, which is a different kind of duplication: forcing three screens with genuinely different fields (a list's name+description, an item's name+price+drag-handle, a group's name-only) through one shared component tends to produce a component full of conditional branches that's harder to read than three small, obvious files. Recognizing _which_ kind of repetition is worth collapsing (shared logic) versus which usually isn't (shared layout with diverging content) is itself a judgment call worth stating explicitly rather than reflexively abstracting on sight.

---

## Step 3 — Managing a group: rename and item membership (Req-11)

**What we did:** `GroupDetailPage.tsx` — an inline rename form (the same toggle-a-boolean, show-a-form-in-place pattern as every other inline edit in this app, going back to `ItemRow`'s rename in Phase 4), a card list of the group's current items each with a remove button, and `AddItemToGroup.tsx` listing catalog items not yet in the group.

**Why items are sorted by the catalog's rank, not alphabetically:** `useGroupItems.ts` sorts by `item.rank` — the same fractional-index rank from Phase 4 that determines shopping-list order. Since every `group_items` row is guaranteed to have a real catalog item behind it (Step 1), there's no "unranked ad-hoc item" case to handle here the way `list_items` had to (Phase 5's `?? Infinity` fallback isn't needed — every row has a real rank). Sorting this way means a group's item list previews the order those items will actually appear in on a shopping list once Phase 8 adds "add this whole group to a list" — a small consistency win that falls out naturally from reusing the same rank field, not something separately engineered.

**Why removing an item from a group updates optimistically (`setGroupItems` before the network call resolves) the same way list-item removal did in Phase 5:** Same reasoning as before — the UI shouldn't wait on a network round-trip to feel responsive, and if the delete fails, `refresh()` reconciles against the real server state afterward.

---

## Step 4 — Built styled from the start

**What we did:** Every file in this phase was written directly against the Phase 6 design system — `Card`/`CardContent` for grouped content, `Button` variants (`default` for primary actions, `outline` for secondary, `ghost` for icon-only actions like remove/rename), `Label`+`Input` pairs for forms, `Separator` between rows, `lucide-react` icons (`ChefHat` for the empty state and nav icon, `ChevronRight` for row navigation, `Pencil` for rename, `X` for remove, `Plus` for add actions), and `PageLoading` for the loading state.

**Why this is worth calling out explicitly:** Phase 6 restyled five phases' worth of screens after the fact — necessary at the time, since styling wasn't planned from day one, but strictly more work than styling once. This phase is the first real test of the payoff: no separate "restyle groups" pass was needed, no `CardTitle`-isn't-a-heading class of bug to rediscover (this phase never reached for `CardTitle` at all, having already learned that lesson), and the three new screens are visually indistinguishable in quality from the five that came before them.

---

## Step 5 — Reaching groups from the base screen (Req-09)

**What we did:** Added `ChefHat` as a third tab in `Home.tsx`'s bottom nav (`Lists` | `Items` | `Groups`), and the `/groups` and `/groups/:id` routes.

**Why it matters here:** Same reasoning as Phase 4's items tab — Req-09 asks specifically for groups to be reachable "from the base screen," and a persistent nav tab is the most literal, always-available way to satisfy that, now scaling cleanly to a third destination without any change to the nav bar's structure.

---

## Verification run

`npm run lint` (still exactly the two accepted warnings from Phase 6 — nothing new), `npm run format:check`, `npm test` (51 tests across 14 files — 5 new this phase: pure validation tests plus a `GroupsScreen` component test mirroring the depth of coverage `ListsScreen`/`ItemsScreen` got in Phases 3–4; `GroupDetailPage`/`AddItemToGroup` weren't given dedicated component tests, the same call made for `ListDetailPage`/`AddFromCatalog` in Phase 5 — nothing in this phase's logic is more novel than what those screens' shared, already-tested primitives (`useAsyncData`, Supabase mocking patterns) already cover), `npm run build`, and `npm run e2e` (still the non-mutating sign-in-screen checks, same reasoning as every phase since Phase 3 — reaching groups needs a real session).

---

## What's required from you

Run `supabase/migrations/0005_groups.sql` in the Supabase SQL Editor. Nothing else new this phase.

Once it's run: click **Groups** in the nav, create one (try "Pizza night"), then open it and add a few items from your catalog — Phase 8 is what lets you add that whole group to an actual shopping list in one go.
