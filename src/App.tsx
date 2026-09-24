import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { AuthScreen } from './auth/AuthScreen'
import { useHousehold } from './household/useHousehold'
import { CreateOrJoinHousehold } from './household/CreateOrJoinHousehold'
import { Home } from './Home'
import { PageLoading } from './components/PageLoading'

function AppRoutes() {
  const { session, loading: authLoading } = useAuth()
  const { household, loading: householdLoading, refresh } = useHousehold()

  if (authLoading) return <PageLoading />
  if (!session) return <AuthScreen />
  if (householdLoading) return <PageLoading />
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
