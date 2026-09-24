# Phase 8: Adding a Group to a List

**Goal of this phase:** the actual payoff of groups existing at all — Req-07: add a whole meal to a shopping list in one action instead of adding four items individually, with a specific interaction the requirements were explicit about: items appear **pre-selected**, and the user deselects anything they don't need before confirming, rather than the group being dumped onto the list immediately with no chance to review.

This phase needed **zero new database migrations.** Everything it does is composition of tables and Row Level Security policies already built: `groups`/`group_items` from Phase 7 tell it what a group contains, and inserting into `list_items` uses the exact same insert policy Phase 5 already wrote (household membership + `created_by = auth.uid()`) — nothing about "insert several rows that came from a group" needed a new rule, because the policy was never written to care _where_ a row's values came from, only _who_ is inserting them and _into which household's list_. Worth noticing on its own: this is what a well-scoped RLS policy from three phases ago paying off looks like.

---

## Step 1 — Two components, not one: picking a group vs. reviewing its items

**What we did:** Split this feature into `AddGroupToList.tsx` (lists the household's groups, lets you pick one) and `GroupSelectionPanel.tsx` (shows that group's items, pre-checked, with deselect and confirm) — rather than one component juggling both states.

**Why:** These are genuinely two different jobs with two different data dependencies — the first only needs `useGroups(householdId)`, the second only needs `useGroupItems(groupId)` for one specific group. Keeping them separate means `GroupSelectionPanel` doesn't need to know how groups get chosen (it just receives a `groupId` and `groupName` as props), and it can be handed a fresh `key={selectedGroup.id}` when the parent swaps which group is selected — forcing React to fully remount it, which matters for Step 2.

---

## Step 2 — Modeling "pre-selected, can deselect" without an initialization effect

**What we did:** Instead of a `selected` set that starts empty and gets filled in once the group's items load (which would need a `useEffect` watching for the data to arrive — the same `set-state-in-effect` shape already accepted as a trade-off elsewhere in this app, see Phase 2's docs), this tracks a `deselected` set that starts empty and only ever grows when the user unchecks something:

```tsx
const [deselected, setDeselected] = useState<Set<string>>(new Set())
const candidates = groupItems.filter((item) => !onListItemIds.has(item.itemId))
const selectedItems = candidates.filter((item) => !deselected.has(item.itemId))
```

**Why this avoids the timing problem entirely, rather than just working around it:** "Everything is pre-selected" and "nothing has been deselected yet" are the same statement. An empty `Set` is a perfectly valid initial value _immediately_, whether `groupItems` has loaded yet or not — there's no moment where the state needs to "catch up" to data that arrived asynchronously, so there's nothing to synchronize with an effect. Combined with the `key`-forced remount from Step 1 (a fresh, empty `deselected` set every time a _different_ group is selected), this is simpler than the set-and-sync approach and produces one fewer lint warning to explain, rather than one more to add to the accepted-trade-off list.

---

## Step 3 — Req-07's exact interaction, and one filtering decision beyond it

**What we did:** `GroupSelectionPanel` renders every item in the chosen group as a checked checkbox by default (Req-07's "automatically selected for adding"), lets the user tap any off, and only inserts the still-checked ones on confirm — exactly the "confirm the group or deselect any that you don't need" behavior asked for.

**The one addition beyond the literal requirement:** items already on the list are filtered out of the panel entirely, using the same `Set` of `itemId`s and the same reasoning `AddFromCatalog.tsx` already uses (Phase 5) — offering to re-add something already there would just create a confusing duplicate row. If _every_ item in the chosen group is already on the list, the panel says so directly ("Every item in this group is already on your list") instead of showing an empty, confusing checklist with a disabled confirm button.

---

## Step 4 — Confirming inserts every selected row in one request

**What we did:**

```ts
await supabase.from('list_items').insert(
  selectedItems.map((item) => ({
    list_id: listId,
    item_id: item.itemId,
    created_by: session?.user.id,
  })),
)
```

**Why a single `insert` call with an array, not one call per item:** Supabase's `insert` accepts either a single row object or an array of rows in one request. Four items from a confirmed Pizza group means one network round-trip and one write to Postgres, not four sequential ones — meaningfully faster for a group with several items, and it means either all the rows the user confirmed land, or none do, rather than a partial failure leaving the list in a state the user never actually asked for.

---

## Verification run

`npm run lint` (still exactly the same two accepted warnings — this phase added no new ones, per Step 2), `npm run format:check`, `npm test` (54 tests across 15 files — 3 new this phase, covering pre-selection, the already-on-list exclusion, and that deselecting an item correctly drops it from the confirmed insert payload — the same "test the distinctive new logic directly" standard `QuickAddItem`'s duplicate-fallback test set in Phase 5), `npm run build`, and `npm run e2e` (unchanged, same reasoning as every phase since Phase 3 — this feature needs a real session, a real list, and a real group to reach).

---

## What's required from you

Nothing — no new migration this phase. Once you've got a group with a few items in it (Phase 7) and an open list, you should see "Add a group" show up as an option on the list detail page.
