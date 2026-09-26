import { supabase } from '../lib/supabaseClient'
import { useAsyncData } from '../lib/useAsyncData'
import { useRealtimeRefresh } from '../lib/useRealtimeRefresh'

export interface ListItem {
  id: string
  itemId: string | null
  name: string
  price: number | null
  rank: number | null
  done: boolean
  quantity: number
}

interface RawListItem {
  id: string
  item_id: string | null
  name: string | null
  price: number | null
  done: boolean
  quantity: number
  items: { name: string; price: number | null; rank: number } | null
}

// Checked-off items sink below everything still unchecked, so the item
// you're standing in front of in-store is always near the top — and
// within each of those two groups, order is still by rank. Unchecking an
// item is symmetric: it just moves back into rank order among the
// unchecked group, nothing about its rank itself ever changes.
export function sortListItems(items: ListItem[]): ListItem[] {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (a.rank ?? Infinity) - (b.rank ?? Infinity)
  })
}

async function fetchListItems(listId: string): Promise<ListItem[]> {
  const { data } = await supabase
    .from('list_items')
    .select('id, item_id, name, price, done, quantity, items(name, price, rank)')
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
    quantity: row.quantity,
  }))

  return sortListItems(resolved)
}

export function useListItems(listId: string) {
  const {
    data: listItems,
    loading,
    refresh,
    setData: setListItems,
  } = useAsyncData<ListItem[]>(listId, fetchListItems, [])

  useRealtimeRefresh('list_items', `list_id=eq.${listId}`, refresh)

  return { listItems, loading, refresh, setListItems }
}
