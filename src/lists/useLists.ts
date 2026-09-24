import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface ShoppingList {
  id: string
  name: string
  description: string | null
}

async function fetchLists(householdId: string): Promise<ShoppingList[]> {
  const { data } = await supabase
    .from('lists')
    .select('id, name, description')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  return data ?? []
}

export function useLists(householdId: string) {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchLists(householdId).then((result) => {
      setLists(result)
      setLoading(false)
    })
  }, [householdId])

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await fetchLists(householdId)
    setLists(result)
    setLoading(false)
  }, [householdId])

  return { lists, loading, refresh }
}
