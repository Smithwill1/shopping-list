import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import type { Item } from '../items/useItems'
import type { ListItem } from './useListItems'

export function AddFromCatalog({
  listId,
  catalogItems,
  listItems,
  onAdded,
}: {
  listId: string
  catalogItems: Item[]
  listItems: ListItem[]
  onAdded: () => void
}) {
  const { session } = useAuth()
  const onListItemIds = new Set(listItems.map((listItem) => listItem.itemId).filter(Boolean))
  const available = catalogItems.filter((item) => !onListItemIds.has(item.id))

  async function addItem(itemId: string) {
    await supabase
      .from('list_items')
      .insert({ list_id: listId, item_id: itemId, created_by: session?.user.id })
    onAdded()
  }

  if (available.length === 0) return null

  return (
    <section>
      <h3>Add from your items</h3>
      <ul>
        {available.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <button type="button" onClick={() => addItem(item.id)}>
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
