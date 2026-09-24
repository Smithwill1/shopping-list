import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useItems } from '../items/useItems'
import { useList } from './useList'
import { useListItems } from '../list-items/useListItems'
import { ListItemRow } from '../list-items/ListItemRow'
import { AddFromCatalog } from '../list-items/AddFromCatalog'
import { QuickAddItem } from '../list-items/QuickAddItem'
import { listTotal, trolleyTotal, unpricedCount } from '../list-items/totals'

export function ListDetailPage({ householdId }: { householdId: string }) {
  const { id } = useParams()
  const listId = id ?? ''

  const { list, loading: listLoading } = useList(listId)
  const { items: catalogItems, refresh: refreshCatalog } = useItems(householdId)
  const { listItems, loading, refresh, setListItems } = useListItems(listId)

  if (listLoading || loading) return <p>Loading…</p>
  if (!list) return <p>List not found.</p>

  function toggleDone(itemId: string, done: boolean) {
    setListItems(listItems.map((item) => (item.id === itemId ? { ...item, done } : item)))
    supabase
      .from('list_items')
      .update({ done })
      .eq('id', itemId)
      .then(({ error }) => {
        if (error) refresh()
      })
  }

  function removeItem(itemId: string) {
    setListItems(listItems.filter((item) => item.id !== itemId))
    supabase
      .from('list_items')
      .delete()
      .eq('id', itemId)
      .then(({ error }) => {
        if (error) refresh()
      })
  }

  async function startNextShop() {
    setListItems(listItems.map((item) => ({ ...item, done: false })))
    const { error } = await supabase
      .from('list_items')
      .update({ done: false })
      .eq('list_id', listId)
    if (error) refresh()
  }

  const total = listTotal(listItems)
  const inTrolley = trolleyTotal(listItems)
  const unpriced = unpricedCount(listItems)

  return (
    <section>
      <h2>{list.name}</h2>
      {list.description && <p>{list.description}</p>}

      <p>
        Total: ${total.toFixed(2)}
        {unpriced > 0 && ` (+${unpriced} unpriced)`}
      </p>
      <p>In trolley: ${inTrolley.toFixed(2)}</p>
      <button type="button" onClick={startNextShop}>
        Start next shop
      </button>

      <ul>
        {listItems.map((item) => (
          <ListItemRow key={item.id} item={item} onToggle={toggleDone} onRemove={removeItem} />
        ))}
      </ul>

      <QuickAddItem
        householdId={householdId}
        listId={listId}
        existingItems={catalogItems}
        onAdded={() => {
          refresh()
          refreshCatalog()
        }}
      />
      <AddFromCatalog
        listId={listId}
        catalogItems={catalogItems}
        listItems={listItems}
        onAdded={refresh}
      />
    </section>
  )
}
