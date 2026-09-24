# Phase 4: The Items Catalog

**Goal of this phase:** a reusable catalog of items (Req-03) that can be viewed (Req-08) and renamed (Req-10), each with an optional rough price and a position controlled entirely by dragging — never by typing a number, per the decision made back when we scoped this out.

---

## Step 1 — Paying down a repeated pattern (`src/lib/useAsyncData.ts`)

**What we did:** Before writing anything item-specific, extracted a shared `useAsyncData` hook and rewrote `useHousehold`, `useLists`, and the new `useItems` to use it, instead of each hand-rolling its own "fetch on mount, expose a refresh function" logic.

**Why now, specifically:** `phase-03-lists.md` predicted this exact moment: _"If a third or fourth hook repeats this shape, that's the point at which extracting a small shared helper stops being premature and starts being justified by actual repetition — worth reassessing then, not now."_ Writing `useItems` the same way `useHousehold` and `useLists` were written would have been the third copy of identical fetch/loading/refresh logic, and the lint warning that came with it (Step 2). Three is the point where "this might be a pattern" becomes "this is definitely a pattern" — extracting it here is following through on that stated threshold, not a new decision.

**What the hook does, and one subtlety worth explaining — the `fetcherRef`:**

```ts
export function useAsyncData<T>(key: string | null, fetcher: (key: string) => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(key !== null)
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher })

  useEffect(() => {
    if (key === null) return
    setLoading(true)
    fetcherRef.current(key).then((result) => { setData(result); setLoading(false) })
  }, [key])
  ...
}
```

The data-fetching effect only re-runs when `key` changes (`[key]` as its dependency array) — that's deliberate, so it doesn't refetch on every render. But the `fetcher` function passed in is a fresh closure every render (it's defined inline at each call site). If the effect called that fresh `fetcher` directly, it would still work today, but would be relying on the effect happening to run at the right time rather than being explicit about it — a "stale closure" bug waiting to happen if the fetcher's own logic ever needed something from a later render. `fetcherRef` sidesteps this: a `ref` that always holds the _latest_ fetcher (kept current by a separate, dependency-free effect that runs after every render), read by the data-fetching effect without being a dependency of it. This is a well-known React pattern usually called a "latest ref."

**Why the ref is updated inside its own `useEffect` rather than directly in the function body:** The first version of this file did `fetcherRef.current = fetcher` directly in the component body (i.e., during render). `oxlint` flagged this immediately (`react(refs): Cannot access refs during render`) — React explicitly warns against mutating a ref's value during rendering, because React can, in some cases (concurrent rendering), render a component more than once before committing, which would mutate the ref multiple times inconsistently. Moving the assignment into a plain effect (no dependency array, so it runs after every render) is the standard fix, and it's a good concrete example of a lint rule catching something genuinely worth knowing, not just a style nitpick.

**Why one `set-state-in-effect` warning still remains, now in exactly one place:** The same accepted trade-off from Phase 2/3 (`setLoading(true)` before an async fetch resolves) is still here — extracting the hook didn't eliminate the underlying pattern, it just stopped it from being copy-pasted three times over. `docs/phase-02-auth-households.md` Step 11 already covers why this specific warning is accepted rather than "fixed" with a data-fetching library; that reasoning applies here unchanged.

---

## Step 2 — The `items` table (`supabase/migrations/0003_items.sql`)

**What we did:** An `items` table scoped to a household (same RLS shape as `lists`), with a `price` column and a `rank` column — plus, unlike `lists`, an actual uniqueness constraint and an `update` policy.

**Why `price numeric(10, 2)` instead of a float type:** Money should never be stored as a floating-point number — floats can't represent amounts like `0.10` exactly, which eventually causes cent-level rounding errors in totals. Postgres's `numeric` type stores decimal digits exactly, which is the correct choice for anything representing currency, even a "rough" price.

**Why `price` has a `check` constraint but is otherwise unconstrained:** `check (price is null or price >= 0)` — null (no price set) is allowed, since Req-05/price wasn't made mandatory, but a negative price is never meaningful and is rejected at the database level, not just in the form.

**Why a real uniqueness constraint exists here, unlike `lists`:** This is the validation rule from the original requirements ("don't add an item... if one with the same name already exists"), scoped specifically to items (and groups, later). `create unique index items_household_name_unique on items (household_id, lower(name))` enforces it case-insensitively — "Bananas" and "bananas" collide — at the database level, which is the actual source of truth; the form-level check (Step 4) is a fast-feedback layer on top of it, not a replacement for it.

**Why `rank` is a `double precision`, not an integer with a uniqueness constraint (the original Req-12 spec):** This is where the earlier decision — drag-to-reorder instead of a typed, unique rank number — actually gets implemented. See Step 3.

---

## Step 3 — Fractional-index ranking (`src/items/rank.ts`)

**What we did:** Two small, pure, directly-unit-tested functions — `nextRank` (where does a brand-new item go) and `rankBetween` (where does a dragged item go).

**The core idea — fractional indexing:** Instead of storing "item 1, item 2, item 3..." as consecutive integers (which means inserting between 1 and 2 requires renumbering everything after it), each item's `rank` is a float with deliberate gaps between values — new items go `1000` past the current highest rank, so the first three items created get ranks `1000`, `2000`, `3000`. Dropping an item between the ones ranked `1000` and `2000` gives it rank `1500` — the midpoint — and touches only that one row. This is the actual mechanism behind the decision made during planning to never ask a user to type a rank number: the app computes it, and the computation happens to be simple arithmetic rather than a full-table renumbering.

```ts
export function rankBetween(before: number | undefined, after: number | undefined): number {
  if (before !== undefined && after !== undefined) return (before + after) / 2
  if (before !== undefined) return before + RANK_STEP
  if (after !== undefined) return after - RANK_STEP
  return RANK_STEP
}
```

Four cases: dropped between two items (midpoint), dropped at the very end (one step past the last item), dropped at the very start (one step before the first item), or the list was empty (the starting value). Each of these four cases has its own unit test in `rank.test.ts` — this function is deliberately kept free of any React, Supabase, or drag-and-drop-library code specifically so it can be tested this directly, the same reasoning as the `validation.ts` files in every phase so far.

**The known limitation, on purpose:** Repeatedly dropping items into the same gap will keep halving it (`1500`, then `1250`, then `1125`...) and, in principle, after enough reorders in the same spot, floating-point precision could run out. This is a real, well-known trade-off of fractional indexing, not an oversight — the fix (periodically renumbering all items back to clean, evenly-spaced integers) is a reasonable future addition once it's ever actually observed to matter, not something worth building defensively against now for a two-person household's grocery list.

---

## Step 4 — Building and reordering the list (`src/items/ItemsScreen.tsx`, `ItemRow.tsx`)

**What we did:** `ItemsScreen` fetches items via `useItems` (ordered by `rank`), shows the same empty-state-vs-smaller-CTA pattern as the lists screen (Req-08), and wraps the list in `@dnd-kit`'s `DndContext`/`SortableContext` for drag-and-drop.

**Why `@dnd-kit` instead of the browser's native HTML5 drag-and-drop:** Native drag-and-drop (`draggable="true"`, `dragstart`/`dragover`/`drop` events) has poor and inconsistent touch-device support — exactly the platform this app is built for. `@dnd-kit` is built on pointer events, which work uniformly across mouse and touch, is actively maintained, and is TypeScript-first.

**Why `ItemRow` has to be its own component, not inlined into `ItemsScreen`'s render loop:** `@dnd-kit`'s `useSortable` is a React hook, and React's rules of hooks forbid calling a hook inside a loop (`items.map(...)`) — every item needs its _own_ call to `useSortable` to get its own drag handlers and transform. Extracting each row into `<ItemRow item={item} />` means the hook is called once per rendered component instance, which is allowed, rather than once per loop iteration inside a single component, which isn't.

**What actually happens on drop:**

```ts
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const oldIndex = items.findIndex((item) => item.id === active.id)
  const newIndex = items.findIndex((item) => item.id === over.id)
  const reordered = arrayMove(items, oldIndex, newIndex)

  const newRank = rankBetween(reordered[newIndex - 1]?.rank, reordered[newIndex + 1]?.rank)
  setItems(reordered.map((item) => (item.id === active.id ? { ...item, rank: newRank } : item)))

  supabase
    .from('items')
    .update({ rank: newRank })
    .eq('id', active.id)
    .then(({ error }) => {
      if (error) refresh()
    })
}
```

Three things happen in order: `@dnd-kit`'s own `arrayMove` utility computes what the reordered array _looks like_ locally; `rankBetween` (Step 3) works out what number that new position actually corresponds to; the UI updates immediately via `setItems` (optimistic — the drag _looks_ instant, it doesn't wait for the network), and only then does the actual database update fire in the background. If that background update fails, `refresh()` re-fetches the real server state, which silently corrects any local optimism that turned out to be wrong — the user sees the drop happen instantly, but the database is still the source of truth if anything goes wrong.

**Why editing a name/price is a per-row inline form (`ItemRow`'s `editing` state) rather than a separate page:** Consistent with every other form in the app so far (`AuthScreen`, `CreateOrJoinHousehold`, `ListsScreen`) — toggle a boolean, show a form in place, submit, toggle back. A separate edit page/route would be more ceremony for less benefit at this list-item scale.

**Why the duplicate-name error is translated into a friendly message:**

```ts
insertError.code === '23505' ? 'An item with this name already exists' : insertError.message
```

`23505` is Postgres's actual error code for a unique-constraint violation (the index from Step 2) — this is the same "database is the real source of truth, the form is just fast feedback" relationship as `validateItemName` versus the unique index itself: the form catches an _empty_ name before any network call, but only the database can definitively catch a _duplicate_ one (another browser tab, or your partner, could create "Bananas" in the half-second between your form loading and you submitting) — so that error has to be handled where it's actually reported from, not assumed away by client-side validation alone.

---

## Step 5 — Reaching the catalog from the base screen (Req-08)

**What we did:** A small `<nav>` in `Home.tsx` with `Lists` and `Items` links, and a new `/items` route.

**Why a nav bar now, when Phase 3 deliberately avoided building navigation infrastructure ahead of need:** Phase 3 introduced routing because a second real page existed; this phase introduces the _first real navigation between pages_ for the same reason — there are now two destinations worth linking between, not one screen with a stub. Req-08 specifically says items should be reachable "from the base screen," which this satisfies literally.

---

## Verification run

Same checks as every phase: `npm run lint` (one warning, in `useAsyncData.ts`, explained above and in Phase 2's docs), `npm run format:check`, `npm test` (35 tests across 9 files), `npm run build`, and `npm run e2e` (still the non-mutating sign-in-screen checks — the items catalog needs a real session to reach, same reasoning as the lists screen in Phase 3; drag-and-drop specifically would also need a real E2E harness capable of simulating pointer-drag gestures, which Playwright can do via `page.mouse.move`/`down`/`up` sequences, but that's a heavier addition being deliberately deferred rather than half-built here).

---

## What's required from you

Run `supabase/migrations/0003_items.sql` in the Supabase SQL Editor. Nothing else new this phase.

Once it's run: sign in, click **Items** in the nav, and you should see the empty state. Add a couple of items with rough prices, then try dragging one — the reorder should feel instant, and refreshing the page should show the new order persisted.
