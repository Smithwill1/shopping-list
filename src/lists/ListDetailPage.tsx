import { useParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useItems } from '../items/useItems'
import { useList } from './useList'
import { useListItems } from '../list-items/useListItems'
import { ListItemRow } from '../list-items/ListItemRow'
import { AddFromCatalog } from '../list-items/AddFromCatalog'
import { QuickAddItem } from '../list-items/QuickAddItem'
import { listTotal, trolleyTotal, unpricedCount } from '../list-items/totals'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageLoading } from '@/components/PageLoading'

export function ListDetailPage({ householdId }: { householdId: string }) {
  const { id } = useParams()
  const listId = id ?? ''

  const { list, loading: listLoading } = useList(listId)
  const { items: catalogItems, refresh: refreshCatalog } = useItems(householdId)
  const { listItems, loading, refresh, setListItems } = useListItems(listId)

  if (listLoading || loading) return <PageLoading />
  if (!list) return <p className="py-12 text-center text-muted-foreground">List not found.</p>

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
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{list.name}</h2>
        {list.description && <p className="text-sm text-muted-foreground">{list.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold tabular-nums">${total.toFixed(2)}</p>
            {unpriced > 0 && <p className="text-xs text-muted-foreground">+{unpriced} unpriced</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs text-muted-foreground">In trolley</p>
            <p className="text-2xl font-bold tabular-nums text-primary">${inTrolley.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Button type="button" variant="outline" onClick={startNextShop}>
        <RotateCcw className="size-4" />
        Start next shop
      </Button>

      {listItems.length > 0 && (
        <Card>
          <CardContent className="flex flex-col">
            {listItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator />}
                <ListItemRow item={item} onToggle={toggleDone} onRemove={removeItem} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
