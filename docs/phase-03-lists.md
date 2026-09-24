# Phase 3: The Lists Screen

**Goal of this phase:** the app's actual home screen — the list of lists (Req-01), and creating a new one (Req-02). This is the first phase where signing in and having a household (Phase 2) leads somewhere with real content, rather than a placeholder message.

---

## Step 1 — The `lists` table (`supabase/migrations/0002_lists.sql`)

**What we did:** One new table, `lists` (`id`, `household_id`, `name`, `description`, `created_by`, `created_at`), with `select` and `insert` RLS policies reusing the `is_household_member()` helper written in Phase 2.

**Why only `select` and `insert`, with no `update`/`delete` policy:** Editing or deleting a list isn't in the requirements — only items and groups have explicit "manage" requirements (Req-10, Req-11). Adding update/delete RLS policies now, with no UI that would ever call them, would be dead security surface: rules that exist but are never exercised or tested. When list editing becomes a real requirement, the policy gets added in the same change as the feature that needs it.

**Why no uniqueness constraint on list names:** The stated validation rule ("don't add an item or group if one with the same name already exists") is scoped to items and groups specifically, not lists. Two lists with the same name is a real, if slightly unusual, thing someone might want (e.g. two "Costco" trips), so this wasn't assumed into scope.

**Why it's still built the same way as `households`:** Same `security`/`RLS` shape as Phase 2 — select/insert scoped through `is_household_member(household_id)` — reused rather than reinvented, since the reasoning already documented in `phase-02-auth-households.md` (why RLS, why a helper function) applies unchanged here.

---

## Step 2 — Introducing routing (`react-router-dom`)

**What we did:** Installed `react-router-dom` and wrapped the app in a `BrowserRouter` (in `App.tsx`), with two routes rendered inside `Home`: `/` (the lists screen) and `/lists/:id` (a list-detail stub).

**Why now, and not earlier:** This was flagged as a deliberate "not yet" in the Phase 2 docs — a router wasn't worth the dependency for a single auth/household gate with no navigable history. That's no longer true: there are now two genuinely separate, bookmarkable pages (a lists overview, and — starting in Phase 3, even as a stub — a specific list). Introducing it exactly when the second real page appears, rather than upfront "just in case," is the same "don't build ahead of what's needed yet" principle applied to routing specifically.

**Why `/lists/:id` exists already even though list detail (items, totals) isn't built until Phase 5:** Clicking a list card needs to go _somewhere_ the moment lists exist, and building the route + a placeholder now means Phase 5 only has to fill in the page's content, not also wire up navigation and URL structure. The stub page reads the `:id` route param via `useParams()` and shows a "coming later" message — intentionally minimal.

**Why this needed a deploy-config change too (`public/_redirects`, `vercel.json`):** Client-side routing means the browser never actually requests `/lists/abc123` from the server under normal navigation (React Router intercepts the click and updates the URL locally) — but if someone refreshes the page, bookmarks it, or your partner opens a shared link directly, the _browser_ does request `/lists/abc123` from whatever's hosting the app. A static host with no configuration will 404, because no file exists at that path — only `index.html` exists, and React Router needs to run to figure out what `/lists/abc123` means. Both files added are the same instruction in each host's own format: "for any path that isn't a real file, serve `index.html` anyway, and let the app's JavaScript take over." Both are included (rather than picking one host now) since the project hasn't committed to Vercel vs. Netlify yet.

---

## Step 3 — Fetching and displaying lists (`src/lists/useLists.ts`, `ListsScreen.tsx`)

**What we did:** `useLists(householdId)` fetches rows from `lists` filtered to the current household, ordered by creation time (oldest first — so the list order is stable and predictable rather than reordering itself). `ListsScreen` renders either an empty state or the list of cards, based on how many came back.

**Req-01's specific empty/non-empty distinction, and how it's implemented:**

```tsx
{
  lists.length === 0 ? (
    <div>
      <p>No lists yet.</p>
      <button type="button" onClick={() => setShowForm(true)}>
        Create your first list
      </button>
    </div>
  ) : (
    <>
      <div>
        <h2>Lists</h2>
        <button type="button" onClick={() => setShowForm((visible) => !visible)}>
          + New list
        </button>
      </div>
      <ul>{/* list cards */}</ul>
    </>
  )
}
```

This is a direct, literal reading of Req-01: a prominent call-to-action when there's nothing yet, versus a smaller, secondary "+ New list" button once real content exists and shouldn't be visually competed with. The same underlying action (open the create form) just gets different visual weight depending on context — handled here with plain conditional rendering rather than a separate "empty state" component, since the actual difference is copy and button prominence, not structure.

**The same `set-state-in-effect` lint trade-off as Phase 2, now appearing twice:** `useLists.ts` has the identical accepted warning documented in `phase-02-auth-households.md` Step 11 (`useHousehold.ts`'s `setLoading(true)` before an async fetch). It's the same pattern, the same reasoning, and the same decision — not re-litigated here, just flagged so it reads as consistent rather than overlooked. If a third or fourth hook repeats this shape, that's the point at which extracting a small shared `useAsyncQuery`-style helper (or adopting a library like TanStack Query) stops being premature and starts being justified by actual repetition — worth reassessing then, not now.

---

## Step 4 — Creating a list (Req-02)

**What we did:** An inline form (shown/hidden by `showForm` state) with a mandatory `name` field and an optional `description` field, validated by `validateListName` before hitting the network — the same client-side-validation-before-network-call pattern used in `AuthScreen` (Phase 2).

```tsx
const { error: insertError } = await supabase.from('lists').insert({
  household_id: householdId,
  name: name.trim(),
  description: description.trim() || null,
  created_by: session?.user.id,
})
```

**Why `description.trim() || null` instead of just `description`:** An empty string and "no description" are different things worth not conflating — storing `null` for "left blank" rather than `''` keeps the database honest about what the user actually did, and makes a future "does this list have a description?" check (`description !== null`) unambiguous.

**Why this is a direct `insert` rather than an RPC (unlike household creation in Phase 2):** Creating a list doesn't need to atomically touch two tables the way household creation did (household + membership) — it's a single row, and the `insert` RLS policy alone (`is_household_member(household_id) and created_by = auth.uid()`) is sufficient to enforce "only a member of this household can create a list here." Reaching for a `security definer` RPC here would be solving a problem this operation doesn't have.

---

## Verification run

Same checks as every phase so far: `npm run lint`, `npm run format:check`, `npm test` (19 tests across 6 files — 5 new this phase), `npm run build`, and `npm run e2e` (still scoped to the non-mutating sign-in-screen checks from Phase 2, for the same reasoning documented there — the lists screen requires a real authenticated session to reach, so its E2E coverage is unit/component-tested instead for now).

---

## What's required from you

Run the new migration: Supabase project → **SQL Editor** → paste `supabase/migrations/0002_lists.sql` → run it. Nothing else this phase — no new environment variables or GitHub secrets.

Once it's run, the natural way to verify this phase is to actually use it: sign in, and you should land on an empty lists screen with a "Create your first list" button. Create one — it should appear immediately with the smaller "+ New list" button now showing alongside it.
