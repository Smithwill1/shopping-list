import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'

export interface Group {
  id: string
  name: string
}

async function fetchGroups(householdId: string): Promise<Group[]> {
  const { data } = await supabase
    .from('groups')
    .select('id, name')
    .eq('household_id', householdId)
    .order('name', { ascending: true })

  return data ?? []
}

export function useGroups(householdId: string) {
  const { data: groups, loading, refresh } = useAsyncData<Group[]>(householdId, fetchGroups, [])

  return { groups, loading, refresh }
}
