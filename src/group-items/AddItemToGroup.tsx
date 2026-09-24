import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import type { Item } from '../items/useItems'
import type { GroupItem } from './useGroupItems'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function AddItemToGroup({
  groupId,
  catalogItems,
  groupItems,
  onAdded,
}: {
  groupId: string
  catalogItems: Item[]
  groupItems: GroupItem[]
  onAdded: () => void
}) {
  const { session } = useAuth()
  const inGroupIds = new Set(groupItems.map((groupItem) => groupItem.itemId))
  const available = catalogItems.filter((item) => !inGroupIds.has(item.id))

  async function addItem(itemId: string) {
    await supabase
      .from('group_items')
      .insert({ group_id: groupId, item_id: itemId, created_by: session?.user.id })
    onAdded()
  }

  if (available.length === 0) return null

  return (
    <Card>
      <CardContent>
        <h3 className="mb-2 text-base font-medium leading-snug">Add from your items</h3>
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
      </CardContent>
    </Card>
  )
}
