import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import type { Item } from '../items/useItems'
import type { ListItem } from './useListItems'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [open, setOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onListItemIds = new Set(listItems.map((listItem) => listItem.itemId).filter(Boolean))
  const available = catalogItems.filter((item) => !onListItemIds.has(item.id))

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuantities({})
      setError(null)
    }
  }

  function quantityOf(itemId: string) {
    return quantities[itemId] ?? 0
  }

  function setQuantity(itemId: string, quantity: number) {
    setQuantities((prev) => {
      if (quantity <= 0) {
        const { [itemId]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: quantity }
    })
  }

  const selected = available.filter((item) => quantityOf(item.id) > 0)
  const selectedCount = selected.reduce((sum, item) => sum + quantityOf(item.id), 0)
  const selectedTotal = selected.reduce(
    (sum, item) => sum + (item.price ?? 0) * quantityOf(item.id),
    0,
  )

  async function confirm() {
    if (selected.length === 0) return

    setSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase.from('list_items').insert(
      selected.map((item) => ({
        list_id: listId,
        item_id: item.id,
        quantity: quantityOf(item.id),
        created_by: session?.user.id,
      })),
    )
    setSubmitting(false)

    if (insertError) {
      setError('Could not add these items — try again')
      return
    }

    handleOpenChange(false)
    onAdded()
  }

  if (available.length === 0) return null

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Add from your items
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[80vh] flex-col">
          <DialogHeader>
            <DialogTitle>Add from your items</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {available.map((item, index) => {
              const quantity = quantityOf(item.id)
              return (
                <div key={item.id}>
                  {index > 0 && <Separator />}
                  <div className="flex items-center gap-2 py-2">
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.price !== null && (
                      <span className="text-sm tabular-nums text-muted-foreground">
                        ${(item.price * Math.max(quantity, 1)).toFixed(2)}
                      </span>
                    )}
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={quantity === 0}
                        onClick={() => setQuantity(item.id, quantity - 1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-4 text-center text-sm tabular-nums">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => setQuantity(item.id, quantity + 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" onClick={confirm} disabled={submitting || selected.length === 0}>
              {selected.length === 0
                ? 'Add items'
                : `Add ${selectedCount} item${selectedCount === 1 ? '' : 's'} ($${selectedTotal.toFixed(2)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
