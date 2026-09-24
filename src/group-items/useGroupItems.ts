import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'

export interface GroupItem {
  id: string
  itemId: string
  name: string
  price: number | null
  rank: number
}

interface RawGroupItem {
  id: string
  item_id: string
  items: { name: string; price: number | null; rank: number }
}

async function fetchGroupItems(groupId: string): Promise<GroupItem[]> {
  const { data } = await supabase
    .from('group_items')
    .select('id, item_id, items(name, price, rank)')
    .eq('group_id', groupId)

  const rows = (data ?? []) as unknown as RawGroupItem[]

  return rows
    .map((row) => ({
      id: row.id,
      itemId: row.item_id,
      name: row.items.name,
      price: row.items.price,
      rank: row.items.rank,
    }))
    .sort((a, b) => a.rank - b.rank)
}

export function useGroupItems(groupId: string) {
  const {
    data: groupItems,
    loading,
    refresh,
    setData: setGroupItems,
  } = useAsyncData<GroupItem[]>(groupId, fetchGroupItems, [])

  return { groupItems, loading, refresh, setGroupItems }
}
