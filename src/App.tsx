import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { AuthScreen } from './auth/AuthScreen'
import { useHousehold } from './household/useHousehold'
import { CreateOrJoinHousehold } from './household/CreateOrJoinHousehold'
import { Home } from './Home'

function AppRoutes() {
  const { session, loading: authLoading } = useAuth()
  const { household, loading: householdLoading, refresh } = useHousehold()

  if (authLoading) return <p>Loading…</p>
  if (!session) return <AuthScreen />
  if (householdLoading) return <p>Loading…</p>
  if (!household) return <CreateOrJoinHousehold onJoined={refresh} />

  return <Home household={household} />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
