import { supabase } from './lib/supabaseClient'
import { InvitePanel } from './household/InvitePanel'
import type { Household } from './household/useHousehold'

export function Home({ household }: { household: Household }) {
  return (
    <main>
      <header>
        <h1>🛒 Shopping List</h1>
        <button type="button" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>
      <p>
        Welcome to <strong>{household.name}</strong>.
      </p>
      <p>Lists, items and groups land in the next phase.</p>
      <InvitePanel householdId={household.id} />
    </main>
  )
}
