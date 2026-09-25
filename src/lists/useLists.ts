import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'
import { useRealtimeRefresh } from '../lib/useRealtimeRefresh'

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
  const {
    data: lists,
    loading,
    refresh,
  } = useAsyncData<ShoppingList[]>(householdId, fetchLists, [])

  useRealtimeRefresh('lists', `household_id=eq.${householdId}`, refresh)

  return { lists, loading, refresh }
}
