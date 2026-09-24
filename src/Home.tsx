import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { ChefHat, ClipboardList, LogOut, ShoppingBasket, UserPlus } from 'lucide-react'
import { supabase } from './lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'
import { InvitePanel } from './household/InvitePanel'
import type { Household } from './household/useHousehold'
import { ListsScreen } from './lists/ListsScreen'
import { ListDetailPage } from './lists/ListDetailPage'
import { ItemsScreen } from './items/ItemsScreen'
import { GroupsScreen } from './groups/GroupsScreen'
import { GroupDetailPage } from './groups/GroupDetailPage'

const NAV_ITEMS = [
  { to: '/', label: 'Lists', icon: ClipboardList },
  { to: '/items', label: 'Items', icon: ShoppingBasket },
  { to: '/groups', label: 'Groups', icon: ChefHat },
]

export function Home({ household }: { household: Household }) {
  const [showInvite, setShowInvite] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🛒 Shopping List</h1>
          <p className="text-sm text-muted-foreground">{household.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Invite your partner"
            onClick={() => setShowInvite((visible) => !visible)}
          >
            <UserPlus className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>

      {showInvite && (
        <div className="pt-4">
          <InvitePanel householdId={household.id} />
        </div>
      )}

      <main className="flex-1 pt-4 pb-24">
        <Routes>
          <Route path="/" element={<ListsScreen householdId={household.id} />} />
          <Route path="/lists/:id" element={<ListDetailPage householdId={household.id} />} />
          <Route path="/items" element={<ItemsScreen householdId={household.id} />} />
          <Route path="/groups" element={<GroupsScreen householdId={household.id} />} />
          <Route path="/groups/:id" element={<GroupDetailPage householdId={household.id} />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border/60 bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[480px] items-center justify-around px-4 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
