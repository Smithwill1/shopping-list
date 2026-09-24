import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'

export interface Item {
  id: string
  name: string
  price: number | null
  rank: number
}

async function fetchItems(householdId: string): Promise<Item[]> {
  const { data } = await supabase
    .from('items')
    .select('id, name, price, rank')
    .eq('household_id', householdId)
    .order('rank', { ascending: true })

  return data ?? []
}

export function useItems(householdId: string) {
  const {
    data: items,
    loading,
    refresh,
    setData: setItems,
  } = useAsyncData<Item[]>(householdId, fetchItems, [])

  return { items, loading, refresh, setItems }
}
