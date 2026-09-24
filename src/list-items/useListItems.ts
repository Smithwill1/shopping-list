import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'

export interface ListItem {
  id: string
  itemId: string | null
  name: string
  price: number | null
  rank: number | null
  done: boolean
}

interface RawListItem {
  id: string
  item_id: string | null
  name: string | null
  price: number | null
  done: boolean
  items: { name: string; price: number | null; rank: number } | null
}

async function fetchListItems(listId: string): Promise<ListItem[]> {
  const { data } = await supabase
    .from('list_items')
    .select('id, item_id, name, price, done, items(name, price, rank)')
    .eq('list_id', listId)
    .order('created_at', { ascending: true })

  const rows = (data ?? []) as unknown as RawListItem[]

  // Catalog-linked rows (item_id set) get their name/price/rank from the
  // joined `items` row; ad-hoc rows (Req-05's "add to list only") use their
  // own name/price and have no rank — sorted last, see below.
  const resolved: ListItem[] = rows.map((row) => ({
    id: row.id,
    itemId: row.item_id,
    name: row.items?.name ?? row.name ?? '',
    price: row.items?.price ?? row.price,
    rank: row.items?.rank ?? null,
    done: row.done,
  }))

  return resolved.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
}

export function useListItems(listId: string) {
  const {
    data: listItems,
    loading,
    refresh,
    setData: setListItems,
  } = useAsyncData<ListItem[]>(listId, fetchListItems, [])

  return { listItems, loading, refresh, setListItems }
}
