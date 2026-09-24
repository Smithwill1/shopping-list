import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'

export interface ListDetails {
  id: string
  name: string
  description: string | null
}

async function fetchList(listId: string): Promise<ListDetails | null> {
  const { data } = await supabase
    .from('lists')
    .select('id, name, description')
    .eq('id', listId)
    .maybeSingle()

  return data ?? null
}

export function useList(listId: string) {
  const { data: list, loading, refresh } = useAsyncData<ListDetails | null>(listId, fetchList, null)

  return { list, loading, refresh }
}
