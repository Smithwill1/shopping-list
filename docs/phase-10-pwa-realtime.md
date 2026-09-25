# Phase 10: PWA & Realtime Polish

**Goal of this phase:** the last phase in the original plan. Three pieces: Supabase Realtime, so you and your partner actually see each other's changes live instead of only on refresh — the whole point of a _shared_ shopping list; an offline-handling pass, since this is a PWA that explicitly promises to work installed on a phone; and finally getting a real deploy target connected, which is the one piece of this phase that needed you, not just code.

The PWA manifest and service worker themselves were already built back in Phase 1 (`vite-plugin-pwa`) — nothing about that setup changed here.

---

## Step 1 — Realtime, and a shared hook instead of six copies of subscription boilerplate

**What we did:** `src/lib/useRealtimeRefresh.ts` — a small hook that opens a Supabase Realtime channel scoped to one table and a filter string, and calls a callback whenever a matching row changes:

```ts
export function useRealtimeRefresh(table: string, filter: string | null, onChange: () => void) {
  useEffect(() => {
    if (filter === null) return
    const channel = supabase
      .channel(`${table}:${filter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => onChange())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, onChange])
}
```

Wired into `useLists` (`household_id=eq.<id>` — a new list your partner creates appears without you navigating away and back) and `useListItems` (`list_id=eq.<id>` — items being added or checked off while you're both looking at the same list, live). Passed `onChange` is just each hook's existing `refresh` function — a realtime event doesn't get special handling, it triggers the exact same refetch a manual "Add" button already does.

**Why this got extracted as a shared hook immediately, rather than written inline twice first:** Unlike `useAsyncData` (Phase 4), which was extracted only after the same pattern showed up a third time, this one was written shared from the start — because the two use sites (`useLists`, `useListItems`) were both already planned before any code was written, so the repetition was obvious in advance rather than discovered after the fact. Same underlying judgment (repeated logic is worth sharing), applied a step earlier this time because the repetition was already known rather than emergent.

**Why realtime is scoped to exactly two tables, not the whole schema:** `supabase/migrations/0006_realtime.sql` only adds `lists` and `list_items` to the `supabase_realtime` publication — `items`, `groups`, and `group_items` deliberately aren't included. The reasoning is in the migration's own comment: editing your item catalog or a meal isn't something two people are typically doing in the same moment the way shopping together is. Turning realtime on for tables with no concurrent-use case would just be additional subscriptions and moving parts with nothing behind them.

**Why Row Level Security still applies to realtime events, and why that matters:** Supabase Realtime only broadcasts a change to a client if that client's own RLS policies would let it `select` the row — the same `is_household_member()` checks from Phase 2 that already govern every query govern realtime events too. A household's changes are never broadcast to anyone outside it; this needed no new security thinking, just the existing policies doing the same job for a new kind of request.

**A deliberate simplicity trade-off, stated plainly:** when _you_ check an item off, the local state already updates optimistically (Phase 5) — and then the realtime event for your own change arrives a moment later and triggers a redundant refetch of data that's already correct. This is harmless (no visual flicker, since the refetched data matches what's already showing) but is genuinely wasted work. Suppressing it would mean tagging each change with an origin (which client made it) and ignoring events that echo back to their own source — real complexity for a cosmetic inefficiency that costs one extra network round-trip per action. Not worth building for a two-person household app.

---

## Step 2 — Offline handling: a visible indicator, and a real bug it led to finding

**What we did:** `src/lib/useOnlineStatus.ts` wraps the browser's `online`/`offline` window events into a hook, and `src/components/OfflineBanner.tsx` shows a small banner at the top of the app whenever the browser reports it's offline — mounted once in `App.tsx`, above the auth gate, so it's visible regardless of sign-in state.

**What "offline handling" deliberately does NOT mean here:** a full offline-first architecture — caching API responses for offline reading, queuing mutations made while offline to sync later, resolving conflicts when two offline edits collide — is a substantial undertaking (a sync engine, essentially) that no requirement asked for and that a two-person household grocery list doesn't need. What's built here is graceful degradation: you're told plainly when you're offline, and the app doesn't do anything actively broken while you are. That's a real, bounded scope decision, not a shortcut taken without noticing the larger possibility.

**The real bug this pass found:** auditing "what happens if a fetch fails" (the same audit instinct Phase 9 applied to error handling) turned up that `useAsyncData` — the hook nearly every screen in this app is built on — never handled a _rejected_ promise, only a resolved one:

```ts
fetcherRef.current(key).then((result) => {
  setData(result)
  setLoading(false)
})
```

If the fetch throws (a network error while offline is the obvious case), that `.then()` never runs, `setLoading(false)` never happens, and the screen shows a spinner forever — with no way to recover even after coming back online, since nothing re-triggers a fetch on its own. Fixed with `.catch()`/`finally()` in the effect and a `try`/`finally` in `refresh()`, so a failed fetch always stops the spinner, even though it deliberately doesn't try to explain _why_ it failed inline — that's the `OfflineBanner`'s job, not every individual screen's.

**Why this justified writing `useAsyncData`'s first dedicated test file, three phases after it was created:** It had never had one — every phase that touched it (4, 5, 7, 8, 9) tested the screens built on top of it, never the hook itself directly. Fixing a real bug in code with no direct test coverage is exactly the moment to add it, so the fix has a regression test and so the hook every future phase will keep building on is verified on its own terms, not just indirectly through whatever happens to use it.

---

## Step 3 — What's required from you: two migrations' worth, one deploy

Two migrations, run **in order**, since `0006` depends on tables `0005` doesn't touch:

```
supabase/migrations/0006_realtime.sql
```

(If you haven't already run `0005_groups.sql` from Phase 7, that needs to go first.)

**Deploy — the one piece of this phase Claude genuinely cannot do:** connecting Vercel or Netlify requires signing into an account (most simply via GitHub OAuth) and authorizing access to the repo through a browser — an interactive step with no equivalent a coding session can perform on your behalf, the same category of limitation as creating the Supabase project itself back in Phase 2. Both hosts already have their config ready in the repo from Phase 3 (`vercel.json`, `public/_redirects`) — whichever you pick, it's a matter of importing the repo and setting two environment variables, not writing any new code.

---

## Verification run

`npm run lint` (still exactly the same two accepted warnings), `npm run format:check`, `npm test` (64 tests across 18 files — 7 new this phase: `useAsyncData`'s first direct test suite covering the rejection fix, and `OfflineBanner`'s online/offline behavior; `ListsScreen.test.tsx`'s Supabase mock needed a `channel`/`removeChannel` stub added, the one existing test realtime's addition actually touched), `npm run build`, and `npm run e2e` (unchanged — realtime subscriptions only ever run behind the auth/household gate this session's E2E coverage doesn't cross, per the standing reasoning since Phase 3).
