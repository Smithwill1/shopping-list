# Phase 9: Validation & Polish Pass

**Goal of this phase:** the original plan always called for this — a consistency sweep across every form, after eight phases of building them one at a time. This phase is different in kind from the others: no new user-facing feature, no new database table. The output is an audit of what got built, and fixes for what the audit found.

Two categories of finding: **duplicated logic** (working correctly, but the same thing written out six times instead of once) and **a genuine gap** (three "Add" buttons that silently did nothing if the insert failed). Both are exactly what a dedicated polish phase is for — the kind of thing that's easy to miss while heads-down building one feature, and easy to spot once you stop and look across all of them at once.

---

## Step 1 — The audit

**What we did:** Before changing anything, searched the whole codebase for the two patterns most likely to have drifted: every `validation.ts` file, and every place handling Postgres's `23505` (unique-violation) error code.

```
find src -name "validation.ts"        →  6 files
grep -rn "23505" src --include="*.tsx" →  6 hits (4 real duplicates, 2 legitimately different)
```

**What the audit found:**

1. Six separate `validation.ts` files, five of which contained the identical one-line pattern (`if (!value.trim()) return '${X} is required'`) with only the label text differing.
2. A genuine duplicate, not just a similar shape: `list-items/validation.ts`'s `validateNewItemName` and `items/validation.ts`'s `validateItemName` had the exact same body _and_ the exact same error message — two files maintaining one fact.
3. Four call sites (`ItemsScreen`, `ItemRow`, `GroupsScreen`, `GroupDetailPage`) with the identical `error.code === '23505' ? '<friendly message>' : error.message` ternary.
4. Three "Add" actions (`AddFromCatalog`, `AddItemToGroup`, `GroupSelectionPanel`'s confirm) that called `supabase...insert(...)` and immediately assumed success — no error was ever checked, so a failed insert (a network blip, a permissions edge case) would silently do nothing while the UI behaved as if it had worked.

Finding #4 is the one worth pausing on: it's not a style inconsistency, it's a real defect that happened to never surface, because on a normal working connection the insert basically always succeeds. That's precisely the kind of thing a dedicated review pass exists to catch — nothing about building `AddFromCatalog` in Phase 5 would have prompted noticing it, because everything worked in every manual test. It only showed up by systematically asking "does every insert in this app check its own error?" and finding three that didn't.

---

## Step 2 — One shared "required field" helper, not six copies

**What we did:** `src/lib/validation.ts`:

```ts
export function requireNonBlank(value: string, fieldLabel: string): string | null {
  if (!value.trim()) return `${fieldLabel} is required`
  return null
}
```

Every domain's `validateXName` became a one-line wrapper: `validateListName` calls `requireNonBlank(name, 'List name')`, and the same for household names, invite codes, item names, and group names. `validateEmail` and `validatePassword` keep their extra rules (format, minimum length) but now start with the same shared required-check rather than their own copy of it.

**Why keep the domain-named wrapper functions instead of just calling `requireNonBlank` directly everywhere:** `validateListName(name)` at a call site is self-documenting; `requireNonBlank(name, 'List name')` repeated at every call site isn't, and repeats the label string instead of defining it once. This mirrors the pattern already used for `useAsyncData` in Phase 4 — the shared primitive isn't meant to replace the domain-specific functions, it's meant to be the one place their common behavior actually lives, with thin, readable, individually-testable wrappers on top.

**Why `list-items/validation.ts` was deleted outright, not just refactored:** Unlike the five `requireNonBlank`-shaped validators, this one wasn't just _structurally_ similar to `items/validation.ts` — it was validating the identical concept (an item's name) with the identical message. `QuickAddItem.tsx` now imports `validateItemName` directly from `items/validation.ts`. This is a different call than the one made in Phase 7's docs about _not_ merging `ListsScreen`/`ItemsScreen`/`GroupsScreen` into one shared component: those three have genuinely different fields per entity (a list's description, an item's price, a drag handle) where forcing a shared abstraction would add branching complexity. This had no such divergence — it was the same fact, asserted twice, and collapsing it removes code without losing anything.

---

## Step 3 — One shared "duplicate name" error formatter

**What we did:** `src/lib/errors.ts`:

```ts
const UNIQUE_VIOLATION = '23505'

export function friendlyError(
  error: { code?: string; message: string },
  duplicateMessage: string,
): string {
  return error.code === UNIQUE_VIOLATION ? duplicateMessage : error.message
}
```

The four call sites that used to inline this ternary now call `friendlyError(insertError, 'An item with this name already exists')` (or the group equivalent) instead.

**Why `QuickAddItem.tsx`'s own `23505` handling was deliberately left alone, not routed through this helper:** It's a superficially similar `if (itemError?.code === '23505')` check, but it does something structurally different — instead of swapping in a friendlier message, it looks up and reuses the existing item so the save-for-later intent still succeeds (documented back in Phase 5). `friendlyError` is for "same failure, nicer words"; this is "different, better outcome for the same underlying condition" — worth keeping visually distinct in the code specifically because they're conceptually different responses to the same error code, not two examples of one pattern.

---

## Step 4 — Fixing the silent-failure gap

**What we did:** `AddFromCatalog.addItem`, `AddItemToGroup.addItem`, and `GroupSelectionPanel.confirm` all now check the `error` their `insert` call returns, and show a short, generic message (`"Could not add that item — try again"`) rather than proceeding as if nothing went wrong.

**Why a generic retry message here, rather than the specific `friendlyError` treatment from Step 3:** These inserts can't hit a unique-name conflict — they're inserting a join-table row (`list_items`/`group_items`), not a named entity — so there's no meaningful "duplicate" case to special-case, only "it failed, try again." Reaching for `friendlyError` here would apply a tool built for a problem this code doesn't have.

**Why this is a fix, not new scope:** Nothing about _what_ these buttons do changed — clicking "Add" still adds an item, same as before. What changed is that the code no longer assumes the network call it just made actually succeeded. This is squarely what "polish" means in a phase whose explicit purpose is a consistency and correctness sweep, not a boundary the phase overstepped.

---

## Verification run

`npm run lint` (still the same two accepted warnings, unchanged), `npm run format:check`, `npm test` (57 tests across 16 files — net +3 from Phase 8's 54: two new files testing the shared `requireNonBlank`/`friendlyError` helpers directly, minus the two tests that were in the now-deleted `list-items/validation.test.ts`, whose coverage was already fully duplicated by `items/validation.test.ts`), `npm run build` (a clean build after deleting a file and rewiring its only import is itself a confirmation nothing was left dangling), and `npm run e2e` (unchanged — this phase touched no auth-independent surface).

---

## What's required from you

Nothing — no schema changes, no new environment variables. Worth trying to trigger one of the fixed error paths yourself if you want to see it (e.g., toggling airplane mode mid-tap on "Add" from the items list) — before this phase it would have failed silently; now it should show a message.
