import { useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { useGroupItems } from '../group-items/useGroupItems'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { PageLoading } from '@/components/PageLoading'
import type { ListItem } from './useListItems'

export function GroupSelectionPanel({
  groupId,
  groupName,
  listId,
  listItems,
  onCancel,
  onConfirmed,
}: {
  groupId: string
  groupName: string
  listId: string
  listItems: ListItem[]
  onCancel: () => void
  onConfirmed: () => void
}) {
  const { session } = useAuth()
  const { groupItems, loading } = useGroupItems(groupId)
  const [deselected, setDeselected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Items already on the list aren't offered again — the same "no
  // duplicates" filtering AddFromCatalog does. Everything else starts
  // selected (per Req-07); `deselected` only ever grows by unchecking.
  const onListItemIds = new Set(listItems.map((item) => item.itemId).filter(Boolean))
  const candidates = groupItems.filter((item) => !onListItemIds.has(item.itemId))
  const selectedItems = candidates.filter((item) => !deselected.has(item.itemId))

  function toggle(itemId: string) {
    setDeselected((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  async function confirm() {
    if (selectedItems.length === 0) return

    setSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase.from('list_items').insert(
      selectedItems.map((item) => ({
        list_id: listId,
        item_id: item.itemId,
        created_by: session?.user.id,
      })),
    )
    setSubmitting(false)

    if (insertError) {
      setError('Could not add these items — try again')
      return
    }

    onConfirmed()
  }

  if (loading) return <PageLoading />

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h3 className="text-base font-medium leading-snug">Add "{groupName}"</h3>

        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Every item in this group is already on your list.
          </p>
        ) : (
          <div className="flex flex-col">
            {candidates.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator />}
                <div className="flex items-center gap-3 py-2">
                  <Checkbox
                    checked={!deselected.has(item.itemId)}
                    onCheckedChange={() => toggle(item.itemId)}
                    aria-label={item.name}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.price !== null && (
                    <span className="text-sm tabular-nums text-muted-foreground">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          {candidates.length > 0 && (
            <Button
              type="button"
              onClick={confirm}
              disabled={submitting || selectedItems.length === 0}
            >
              <Check className="size-4" />
              Add {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className={candidates.length === 0 ? 'col-span-2' : ''}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
