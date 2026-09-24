# Phase 5: Putting Items on a List

**Goal of this phase:** the part of the app that actually gets used during a shop — adding items to a list from the catalog (Req-04) or by typing a new name (Req-05), sorted by rank (Req-13), swiped off when not needed (Req-14), checked off as they go in the trolley, and the running totals and "start next shop" reset agreed on back when the price/trolley requirements were added.

---

## Step 1 — The `list_items` table, and why `item_id` is nullable

**What we did:** A join table between `lists` and `items`, but with a twist most join tables don't need: `item_id` can be `null`.

**Why:** Req-05 draws a real distinction between two different actions that look similar — "add this to my list" versus "add this to my list _and_ remember it for next time." The second creates a catalog `items` row; the first deliberately must not. That means a `list_items` row sometimes has nothing to join to. The table carries its own `name`/`price` columns for exactly that case, with a check constraint enforcing the rule at the database level: `check (item_id is not null or name is not null)` — a row must be either linked to a real catalog item, or self-contained, never neither.

**How the app reconciles "sometimes joined, sometimes not" into one consistent shape** (`src/list-items/useListItems.ts`):

```ts
const resolved: ListItem[] = rows.map((row) => ({
  id: row.id,
  itemId: row.item_id,
  name: row.items?.name ?? row.name ?? '',
  price: row.items?.price ?? row.price,
  rank: row.items?.rank ?? null,
  done: row.done,
}))
```

Every row gets resolved down to one flat `ListItem` shape with an _effective_ name/price/rank, regardless of which of the two cases produced it — everything downstream (sorting, totals, rendering) works with that single shape and never has to know or care which kind of row it started as.

**Why Req-13's sort (lowest rank first) happens in JavaScript, not in the SQL query:** An ad-hoc item has no rank at all (it was never given a supermarket-aisle position, because it isn't in the catalog) — it needs to sort _after_ every ranked item, not before or randomly among them. Expressing "sort by this column, but treat missing values as infinitely large, across a left-joined relationship" is exactly the kind of query PostgREST's query-builder syntax isn't well suited to. Fetching in a stable base order (`order('created_at')`) and sorting client-side with `(a.rank ?? Infinity) - (b.rank ?? Infinity)` is simpler, easier to read, and for a list of at most a few dozen items has no real performance cost.

**Why `list_items` gets a `delete` policy when `lists` and `items` didn't:** This is the first table where deleting a row is an actual, explicit requirement (Req-14, swipe to remove) rather than something outside scope. The RLS shape itself is new too — since `household_id` isn't a column on `list_items` directly, the policy has to reach it through `lists`:

```sql
using (
  exists (
    select 1 from lists
    where lists.id = list_items.list_id
      and is_household_member(lists.household_id)
  )
)
```

All four policies (select/insert/update/delete) use this same subquery shape — the same `is_household_member()` helper from Phase 2, just reached one join further away.

---

## Step 2 — Two different meanings of "remove" (the check-off/swipe split)

**What we did:** Two separate, deliberately distinct controls on each row — a checkbox-style button that toggles `done`, and a swipe gesture (`react-swipeable`) that deletes the row outright.

**Why this distinction exists at all:** This was worked out during planning, before any code — the original ambiguity was that "removing an item" could mean either "I bought it" or "I didn't need it after all," and only one of those should count toward a total. Splitting them into two different gestures (tap vs. swipe) resolves that ambiguity in the interaction itself, rather than trying to infer intent from a single action:

```tsx
<button onClick={() => onToggle(item.id, !item.done)}>{item.done ? '✓' : '○'}</button>
```

Toggling `done` never deletes anything — the row stays, crossed out, and its price starts counting toward the trolley total (Step 4). Only a swipe removes the row, and a removed row was never "bought," so it never touched any total.

**Why `react-swipeable` instead of `@dnd-kit` (already in the project from Phase 4):** They solve different problems. `@dnd-kit` is built for _reordering_ — picking something up and dropping it somewhere else in a list. This is a _dismiss_ gesture — one direction, one outcome, no drop target. `react-swipeable` is a small, purpose-built hook for exactly that, and pulling `@dnd-kit` into a job it isn't designed for would be the wrong tool for the sake of avoiding one more small dependency.

**A genuine, un-fixed accessibility gap, noted rather than hidden:** Swipe-to-remove is a mobile-native gesture, but it has no equivalent for anyone using a keyboard or a screen reader — there's currently no button-based fallback for removing an item. Req-14 asks for "a single swipe" specifically, so this is what got built, but it's worth flagging plainly: a real production app would want a second, non-gesture way to remove an item (a visible delete button, or a swipe-reveals-a-button pattern) for accessibility. Recorded here so it reads as a known gap, not a missed one.

---

## Step 3 — Adding items, two ways (Req-04, Req-05)

**`AddFromCatalog.tsx` (Req-04):** Filters the household's item catalog down to items _not already on this list_ (`catalogItems.filter((item) => !onListItemIds.has(item.id))`), and renders an "Add" button per row. Each click is a single `insert` into `list_items` with `item_id` set — the catalog item's name/price/rank all come along for free through the join described in Step 1.

**`QuickAddItem.tsx` (Req-05), and the "add and save" fallback worth explaining:** The two buttons map directly onto the two cases from Step 1 — "Add to list" inserts a `list_items` row with just a `name`, no `item_id`; "Add + save for later" first inserts into `items`, then links the new item's id into `list_items`. The interesting part is what happens when that first insert hits the unique-name constraint from Phase 4:

```ts
if (itemError?.code === '23505') {
  const { data: existing } = await supabase
    .from('items')
    .select('id')
    .eq('household_id', householdId)
    .ilike('name', name.trim())
    .maybeSingle()
  itemId = existing?.id ?? null
}
```

If an item with that name already exists — plausibly because your partner added it five minutes ago — the naive behaviour would be to show an error and stop. Instead, this looks the existing item up and links to _that_ one. The user's actual intent ("make sure this is in my catalog, and on this list") is still fully satisfied; the fact that someone beat them to creating it is an implementation detail they shouldn't have to deal with. This exact behaviour — the happy path, the "add to list only" path, and the duplicate-reuse fallback — is what `QuickAddItem.test.tsx` covers with a mocked Supabase client, since it's the most distinctive logic introduced this phase.

---

## Step 4 — Totals and the trolley (`src/list-items/totals.ts`)

**What we did:** Three small pure functions — `listTotal`, `trolleyTotal`, `unpricedCount` — each taking the same flat `ListItem[]` shape from Step 1 and doing one job.

```ts
export function listTotal(items: PricedListItem[]): number {
  return items.reduce((sum, item) => sum + (item.price ?? 0), 0)
}

export function trolleyTotal(items: PricedListItem[]): number {
  return items.filter((item) => item.done).reduce((sum, item) => sum + (item.price ?? 0), 0)
}
```

`listTotal` sums every item currently on the list, checked or not — the rough cost of the whole shop. `trolleyTotal` sums only the checked ones — what's actually in the trolley right now, live, as items get checked off during the shop. Both treat a missing price as `0` rather than breaking the sum, and `unpricedCount` surfaces how many items were skipped that way, so the UI can show "(+2 unpriced)" instead of silently understating the total. Kept as plain functions with no React or Supabase involved, the same reasoning as `rank.ts` in Phase 4 — trivial to test directly, and reusable anywhere a total needs computing.

---

## Step 5 — "Start next shop" (the weekly-persistence decision)

**What we did:** A single button that resets every item's `done` back to `false` for the list, in one bulk update:

```ts
await supabase.from('list_items').update({ done: false }).eq('list_id', listId)
```

**Why this exists instead of deleting checked items (what the original vanilla prototype's "Clear checked" did):** This was also settled during planning — since the same list is meant to live on week to week rather than being consumed and rebuilt, "finishing a shop" should mean the trolley total resets to zero and everything reappears unchecked for next time, not that the list gets emptied out. An item that genuinely shouldn't recur is removed deliberately, by swiping it (Step 2) — a separate action from the routine weekly reset.

**Why a plain bulk update, not a `security definer` RPC (unlike household/invite creation in Phase 2):** This only ever touches one table, and the existing `update` RLS policy on `list_items` (household members only) already fully covers "who is allowed to do this" — there's no cross-table atomicity problem here for an RPC to solve.

---

## Verification run

Same checks as every phase: `npm run lint` (still the one documented warning), `npm run format:check`, `npm test` (46 tests across 12 files — 11 new this phase), `npm run build`, and `npm run e2e` (still the non-mutating sign-in-screen checks — reaching a real list needs a real session and a real list, so this phase's coverage is unit/component-tested rather than E2E, the same reasoning as Phases 3 and 4). Drag-and-drop wasn't E2E-tested in Phase 4 for the same underlying reason swipe-to-remove isn't here: Playwright _can_ simulate both via raw pointer-event sequences, but that's a deliberately deferred addition rather than a half-built one.

---

## What's required from you

Run `supabase/migrations/0004_list_items.sql` in the Supabase SQL Editor. Nothing else new this phase.

Once it's run: open a list, add a few items both ways (from your catalog, and by typing a new name with each of the two buttons), check some off and watch the trolley total move, swipe one away, and try "Start next shop" once you're done.
