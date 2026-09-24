import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { InvitePanel } from './household/InvitePanel'
import type { Household } from './household/useHousehold'
import { ListsScreen } from './lists/ListsScreen'
import { ListDetailPage } from './lists/ListDetailPage'

export function Home({ household }: { household: Household }) {
  const [showInvite, setShowInvite] = useState(false)

  return (
    <main>
      <header>
        <h1>🛒 Shopping List</h1>
        <button type="button" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>
      <p>{household.name}</p>

      <Routes>
        <Route path="/" element={<ListsScreen householdId={household.id} />} />
        <Route path="/lists/:id" element={<ListDetailPage />} />
      </Routes>

      <button type="button" onClick={() => setShowInvite((visible) => !visible)}>
        {showInvite ? 'Hide invite panel' : 'Invite your partner'}
      </button>
      {showInvite && <InvitePanel householdId={household.id} />}
    </main>
  )
}
