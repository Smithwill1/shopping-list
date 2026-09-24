import { useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import type { Item } from '../items/useItems'
import type { ListItem } from './useListItems'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
  const [error, setError] = useState<string | null>(null)
  const onListItemIds = new Set(listItems.map((listItem) => listItem.itemId).filter(Boolean))
  const available = catalogItems.filter((item) => !onListItemIds.has(item.id))

  async function addItem(itemId: string) {
    setError(null)
    const { error: insertError } = await supabase
      .from('list_items')
      .insert({ list_id: listId, item_id: itemId, created_by: session?.user.id })

    if (insertError) {
      setError('Could not add that item — try again')
      return
    }

    onAdded()
  }

  if (available.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-medium leading-snug">Add from your items</h3>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-col">
          {available.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <Separator />}
              <div className="flex items-center justify-between gap-3 py-2">
                <span>{item.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => addItem(item.id)}>
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
