import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'
import { useAuth } from '../auth/useAuth'

export interface Household {
  id: string
  name: string
}

async function fetchHousehold(userId: string): Promise<Household | null> {
  const { data } = await supabase
    .from('household_members')
    .select('household:households(id, name)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  return (data?.household as unknown as Household) ?? null
}

export function useHousehold() {
  const { session } = useAuth()
  const {
    data: household,
    loading,
    refresh,
  } = useAsyncData<Household | null>(session?.user.id ?? null, fetchHousehold, null)

  return { household, loading, refresh }
}
