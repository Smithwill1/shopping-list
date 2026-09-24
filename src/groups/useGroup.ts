import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'

export interface GroupDetails {
  id: string
  name: string
}

async function fetchGroup(groupId: string): Promise<GroupDetails | null> {
  const { data } = await supabase.from('groups').select('id, name').eq('id', groupId).maybeSingle()

  return data ?? null
}

export function useGroup(groupId: string) {
  const {
    data: group,
    loading,
    refresh,
  } = useAsyncData<GroupDetails | null>(groupId, fetchGroup, null)

  return { group, loading, refresh }
}
