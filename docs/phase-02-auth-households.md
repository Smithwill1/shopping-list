# Phase 2: Auth & Households

**Goal of this phase:** two people can each sign in with their own account and land in the same shared space. Nothing about lists, items, or groups exists yet — this phase is entirely about the question "who is this, and what shared data are they allowed to see?", because every later phase depends on the answer being solid.

---

## Step 1 — Why a "household" table has to exist at all

**What we did:** Before writing any code, decided that lists/items/groups will never belong directly to a user — they'll belong to a **household**, and users are linked to a household through a **membership** table.

**Why:** If data belonged directly to a user, "shared between two people" would mean copying data between two owners and keeping it in sync — fragile, and not how real shared-data apps work. Modelling a household as its own entity, with users attached to it, means "shared" is just "more than one user attached to the same household row." This single decision is what makes every future feature (a list, an item) automatically shared the moment it's linked to a household, with no extra sharing logic per feature.

**Why it matters here:** Every table this app will ever have from here on will have a `household_id` column, not a `user_id` column. Getting this foundation right now avoids rewriting the entire data model later.

---

## Step 2 — The database schema and Row Level Security (`supabase/migrations/0001_households.sql`)

**What we did:** Wrote a SQL migration creating three tables and the security rules around them.

**The tables:**

- `households` — `id`, `name`, `created_by`, `created_at`.
- `household_members` — a **join table** linking a `household_id` to a `user_id`. This is what "being in a household" actually means in the database: a row existing in this table.
- `household_invites` — a `code`, which household it grants access to, when it expires, and whether/by whom it's been redeemed.

**What Row Level Security (RLS) is, and why it's not optional here:** By default, if your Supabase anon key can query a table at all, it can see _every row_ in it — the key itself carries no notion of "which user is asking." RLS is a Postgres feature that attaches a rule to a table saying which rows a given request is allowed to touch, evaluated on the database itself, not trusted to the client code. This matters enormously for this app specifically: without RLS, any signed-in user (including a stranger, since sign-up is open) could query `households` and see your partner's grocery list. `alter table households enable row level security;` plus a `create policy` statement is the mechanism.

**The core policy shape:**

```sql
create policy "members can view their households"
  on households for select
  using (is_household_member(id));
```

This reads as: "a `select` on `households` is only allowed to return rows where `is_household_member(id)` is true for the requesting user." Every table gets an equivalent rule.

**Why a helper function (`is_household_member`) instead of writing the membership check inline in each policy:** The natural way to check "is this user a member of this household" is a lookup against `household_members` — but writing that lookup _inside a policy on `household_members` itself_ creates a self-referential check (checking membership to decide if you can read the membership table), which Postgres either blocks or evaluates awkwardly. The standard fix, and the one used here, is a small SQL function marked `security definer`, which means it runs with the _function owner's_ privileges rather than the caller's — so it can freely read `household_members` to answer "is this user a member?" without being subject to the very RLS policy that depends on its answer. This is a well-known, standard Supabase pattern, not a hand-rolled workaround.

**Why household membership can't be created by a normal `insert`:** There's deliberately no RLS `insert` policy on `household_members` for regular users. If there were, you'd need to very carefully constrain it (a user could otherwise insert themselves into _any_ household by guessing an id). Instead, membership is only ever created by two functions:

```sql
create function create_household(p_name text) returns households
language plpgsql security definer set search_path = public as $$ ... $$;

create function redeem_invite(p_code text) returns households
language plpgsql security definer set search_path = public as $$ ... $$;
```

- `create_household` inserts the household row _and_ the creator's membership row, inside one function call — so a household can never exist without its creator already being a member.
- `redeem_invite` looks up the invite by code, checks it hasn't expired or already been used, inserts membership for the redeeming user, and marks the invite as redeemed — all atomically. This is also the only way a _second_ person can ever gain access to a household: they cannot see `household_members` or `households` for a household they're not in yet (RLS blocks it), so a plain insert wouldn't be possible even if it were allowed — the invite code is the only door in, and the `security definer` function is what lets that door work despite RLS.

**`set search_path = public`** on each function is a specific, deliberate security hardening step: without it, a `security definer` function could in principle be tricked into running a differently-named function or table from a different schema that happens to be earlier in a manipulated search path. Pinning the search path closes that off.

**Why this file lives in `supabase/migrations/` even though nothing runs it automatically yet:** Keeping schema changes as numbered, version-controlled SQL files (rather than clicking through the Supabase dashboard and never writing anything down) means the database schema has the same history/review/rollback properties as the application code. Right now it has to be run manually via the Supabase SQL Editor (see "What's required from you," below) — wiring up the Supabase CLI to apply migrations automatically is a reasonable future improvement, noted rather than built now since it needs Docker locally and would be scope creep for this phase.

---

## Step 3 — The auth state layer (`src/auth/AuthContext.ts`, `AuthProvider.tsx`, `useAuth.ts`)

**What we did:** Split "knowing who's signed in" into three small files rather than one.

**What a Supabase "session" is:** When someone signs in, Supabase returns a session object (an access token, a refresh token, and the user record) and Supabase's client library persists it in the browser's storage automatically. "Is someone signed in" is really "does a valid session currently exist," and it can change at any time — sign-in, sign-out, or a background token refresh — which is why it's modelled as _state that changes_, not a one-time check.

**Why a React Context instead of just calling `supabase.auth.getSession()` wherever it's needed:** Without it, every component that needs to know "is someone signed in" would have to independently ask Supabase and independently subscribe to auth changes — repeated logic, and multiple components could disagree with each other for a moment after a sign-out. `AuthProvider` asks once, near the top of the component tree, and everything below it reads the same answer via `useAuth()`.

**Why `AuthContext` is its own file, separate from `AuthProvider.tsx`:** This one is a tooling detail rather than a design one — Vite's Fast Refresh (the "save a file, see the change without losing component state" dev-server feature) only works reliably on files that export _only_ components. `AuthProvider.tsx` exports the `AuthProvider` component; if it also exported the context object, Fast Refresh would degrade to a full page reload on every edit to that file. The linter (`oxlint`) flagged this directly — see Step 11.

**The subscription pattern in `AuthProvider`:**

```tsx
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session)
    setLoading(false)
  })
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, newSession) => {
    setSession(newSession)
  })
  return () => subscription.unsubscribe()
}, [])
```

Two things happen: an immediate one-time check for an existing session (so a page refresh doesn't flash a "signed out" state before catching up), and a subscription that keeps `session` in sync with _any_ future change — sign-in, sign-out, or a token refresh happening in the background. The returned cleanup function unsubscribing is what stops the listener leaking if `AuthProvider` were ever unmounted.

---

## Step 4 — Pure validation functions (`src/auth/validation.ts`, `src/household/validation.ts`)

**What we did:** Wrote `validateEmail`, `validatePassword`, `validateHouseholdName`, and `validateInviteCode` as plain functions with no dependency on React, Supabase, or the DOM — each takes a string, returns an error message or `null`.

**Why pull these out of the form components instead of validating inline:** Two reasons. First, testability — a pure function can be unit tested directly (see `validation.test.ts`) with no mocking of network or rendering required, which is the fastest and most reliable kind of test to write and run. Second, reuse — the same "is this a valid email" question will come up again wherever email is collected later.

**Why it matters here:** This is the same principle as Phase 1's testing pyramid in practice: push as much logic as possible into plain functions that unit tests can hit directly, and reserve slower component/E2E tests for things that genuinely require rendering or a browser.

---

## Step 5 — The sign-in/sign-up screen (`src/auth/AuthScreen.tsx`)

**What we did:** One component handling both sign-in and sign-up, toggled by a `mode` state value, rather than two separate screens/routes.

**Why one component instead of two:** The form is identical (email, password) in both modes — only the submit action and heading text differ. A single component avoids duplicating the input/validation/error-handling logic; the small amount of `mode === 'sign-in' ? ... : ...` branching is cheaper than two components that would drift apart over time.

**Why validation runs client-side before calling Supabase at all:**

```tsx
const validationError = validateEmail(email) ?? validatePassword(password)
if (validationError) {
  setError(validationError)
  return
}
```

This is a pure UX improvement, not a security boundary — the database itself enforces the rules that actually matter (see Step 2). Catching an obviously-blank email before making a network round-trip gives instant feedback instead of a delayed, vaguer error from the server.

**Why the submit button disables itself during `submitting`:** Without it, a slow network combined with an impatient double-click would fire two sign-up requests. `disabled={submitting}` is the cheapest possible protection against that.

---

## Step 6 — The household gate (`src/household/useHousehold.ts`, `CreateOrJoinHousehold.tsx`)

**What we did:** After a user is signed in, a second check runs: do they already belong to a household? `useHousehold` answers that by querying `household_members`, joined to `households`:

```ts
supabase
  .from('household_members')
  .select('household:households(id, name)')
  .eq('user_id', userId)
  .limit(1)
  .maybeSingle()
```

This is Supabase's syntax for a **nested select across a foreign key** — `household:households(id, name)` reads as "follow the relationship to `households` and bring back its `id` and `name`, aliased as `household`" — one round trip instead of two separate queries.

**Why `CreateOrJoinHousehold` calls RPCs (`supabase.rpc('create_household', ...)`) instead of inserting rows directly:** This is the client-side half of the Step 2 decision — the RLS policies don't allow a direct insert into `household_members` at all, so the only way to create or join a household from the app is by calling the two `security definer` database functions. The React code doesn't need to know _why_ — it just calls the function and handles the error if the invite code was wrong or expired.

---

## Step 7 — Generating invite codes (`src/household/InvitePanel.tsx`)

**What we did:** A client-generated random 8-character code (from an alphabet that excludes visually ambiguous characters — no `0`/`O`, `1`/`I`), inserted as a new `household_invites` row.

```ts
const bytes = crypto.getRandomValues(new Uint8Array(length))
```

**Why `crypto.getRandomValues` instead of `Math.random()`:** `Math.random()` is not cryptographically secure — its output can, in principle, be predicted. For an invite code that grants access to private data, using the browser's actual cryptographic random number generator is the correct choice even though the practical risk for a two-person household app is low; it costs nothing extra to do it properly, and it's the kind of detail worth being able to explain in an interview.

**Why this insert is allowed but membership creation isn't (Step 2):** Creating an invite only ever grants access to a household the creator is _already_ a member of (enforced by the `insert` policy's `is_household_member(household_id)` check) — it can't be used to gain access to anything, only to delegate access you already have. That's a fundamentally different, safer operation than inserting membership directly, which is why one goes through a normal RLS-protected insert and the other requires a `security definer` function.

---

## Step 8 — Wiring it together (`src/App.tsx`)

**What we did:** A single component that checks, in order: is auth still loading → is there no session → is household data still loading → is there no household → otherwise render the real app.

```tsx
if (authLoading) return <p>Loading…</p>
if (!session) return <AuthScreen />
if (householdLoading) return <p>Loading…</p>
if (!household) return <CreateOrJoinHousehold onJoined={refresh} />
return <Home household={household} />
```

**Why this shape, rather than a routing library:** With exactly four possible states and no navigable history to preserve (you don't "go back" from signed-in to signed-out), a plain sequence of conditions is simpler and more honest than pulling in a router for one gate. A router becomes worth it once Phase 3 introduces genuinely separate pages (a lists screen, a list-detail screen, an items-catalog screen) with URLs worth bookmarking — that's a deliberate "not yet" rather than an oversight.

---

## Step 9 — Updating the tests

**What we did:** Replaced the old generic `App.test.tsx` smoke test, and added new ones for the auth/household validation and the `AuthScreen` component.

**Why the old smoke test had to change:** It asserted the "Shopping List" heading was present — true before, but no longer sufficient, since that heading now appears on _every_ screen (signed out, no household, signed in). The new version asserts specifically that the **sign-in heading** appears when there's no session, which is the behaviour that actually changed this phase.

**Why `AuthScreen.test.tsx` mocks `supabase` instead of calling the real one:**

```ts
vi.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { signInWithPassword: vi.fn(), signUp: vi.fn() } },
}))
```

Unit/component tests should be fast, deterministic, and independent of network access or a real backend's state — hitting the real Supabase project from a unit test would make the test slow, flaky (depends on network), and worse, would create real user accounts in the real project every time the test suite runs. `vi.mock` replaces the module entirely with a stub that records calls but does nothing, which is exactly what's needed to test "does clicking submit call the right function with the right arguments," without any of those problems.

---

## Step 10 — Updating Playwright and CI for the auth gate

**What we did:** Updated `e2e/app.spec.ts` to assert the sign-in screen appears, and added a second E2E test asserting the same blank-email validation error Playwright drives against a **real browser** rather than jsdom. Added the two Supabase environment variables to `.github/workflows/ci.yml` as job-level `env`, sourced from GitHub Actions repository secrets.

**Why E2E tests here still don't submit real sign-in/sign-up credentials:** Unlike the unit tests, Playwright's E2E tests run against the actual built app connected to the actual Supabase project (there's no practical way to fully fake a backend for a true end-to-end test without a lot of extra infrastructure). That's fine for tests that only check what renders and what client-side validation does — but a test that actually submitted the sign-up form would create a real, permanent user account in the real project on every CI run. Rather than build a disposable test-project setup for that right now (an over-engineered choice this early), the E2E coverage here is deliberately scoped to non-mutating checks; a follow-up phase could add a dedicated Supabase test project specifically for exercising real sign-up/invite flows in CI.

**Why CI needs the Supabase URL and anon key at all:** Vite inlines `import.meta.env.VITE_*` values into the JavaScript bundle _at build time_, not at runtime — so the values have to be present when `npm run build` runs in the CI job, not just when the app is later served. Without them, `src/lib/supabaseClient.ts`'s fail-fast check (Phase 1) throws the moment the bundled app loads in Playwright's browser, and every E2E test fails immediately.

**Why it's safe to put the anon key in GitHub Actions secrets (and not the `service_role` key):** The anon key is specifically designed by Supabase to be public-safe — it's the same key that ends up embedded in the shipped JavaScript bundle anyway, readable by anyone who opens browser dev tools on the live site. Its safety depends entirely on RLS (Step 2) actually being correct, not on the key being hidden. The `service_role` key, by contrast, bypasses RLS entirely and must never appear in client code, CI logs, or anywhere a browser can read it.

---

## Step 11 — A documented lint trade-off

**What we did:** Left one `oxlint` warning unresolved on `useHousehold.ts` (`react(set-state-in-effect)`, flagging `setLoading(true)` being called synchronously inside a `useEffect` before the async fetch resolves), after fixing a second, unrelated warning by moving `AuthContext` into its own file (Step 3).

**Why this one warning is being accepted rather than fixed:** The lint rule's underlying advice — don't call `setState` synchronously inside an effect if the value can be derived during render instead — is good advice in general, and was applied to remove the _first_ warning on this file (see the file's git history). This second warning flags the standard "set loading, then fetch, then clear loading" pattern used by essentially every hand-rolled data-fetching hook in React. Properly eliminating it means adopting a request-cancellation pattern or a data-fetching library (e.g. TanStack Query) — real solutions, but disproportionate to add for one hook at this stage of the project. `npm run lint` exits `0` on warnings (only errors fail CI), so this doesn't block anything; it's recorded here explicitly so it reads as a deliberate decision, not a missed one, next time this file is touched.

---

## Verification run

Before considering this phase done, the same checks as Phase 1 were run locally, now against real Supabase credentials in `.env.local`: `npm run lint`, `npm run format:check`, `npm test` (14 tests across 4 files), `npm run build`, and `npm run e2e` (2 tests, run against the real project — confirming the app boots correctly with real credentials without submitting any data).

---

## What's required from you before this phase is fully live

Two things only Supabase/GitHub account access can do:

1. **Run the migration.** Open your Supabase project → **SQL Editor** → paste the contents of `supabase/migrations/0001_households.sql` → run it. This creates the three tables, the RLS policies, and the two functions.
2. **Add two GitHub Actions secrets**, so CI can build and run E2E tests: on the repo, **Settings → Secrets and variables → Actions → New repository secret**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values as your local `.env.local`.

Once both are done, tell me and I'll verify the actual sign-up → create-household → generate-invite → (second account) redeem-invite flow works end to end against your real project before we move to Phase 3.
