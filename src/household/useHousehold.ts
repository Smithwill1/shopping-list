import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
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
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return

    setLoading(true)
    fetchHousehold(session.user.id).then((result) => {
      setHousehold(result)
      setLoading(false)
    })
  }, [session])

  const refresh = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const result = await fetchHousehold(session.user.id)
    setHousehold(result)
    setLoading(false)
  }, [session])

  if (!session) {
    return { household: null, loading: false, refresh }
  }

  return { household, loading, refresh }
}
