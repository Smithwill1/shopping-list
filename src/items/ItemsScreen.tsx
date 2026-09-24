import { useState, type FormEvent } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, ShoppingBasket } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { useItems } from './useItems'
import { ItemRow } from './ItemRow'
import { validateItemName, validatePrice } from './validation'
import { nextRank, rankBetween } from './rank'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PageLoading } from '@/components/PageLoading'

export function ItemsScreen({ householdId }: { householdId: string }) {
  const { session } = useAuth()
  const { items, loading, refresh, setItems } = useItems(householdId)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validateItemName(name) ?? validatePrice(price)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('items').insert({
      household_id: householdId,
      name: name.trim(),
      price: price.trim() ? Number(price) : null,
      rank: nextRank(items),
      created_by: session?.user.id,
    })
    setSubmitting(false)

    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'An item with this name already exists'
          : insertError.message,
      )
      return
    }

    setName('')
    setPrice('')
    setShowForm(false)
    refresh()
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)

    const newRank = rankBetween(reordered[newIndex - 1]?.rank, reordered[newIndex + 1]?.rank)
    const updated = reordered.map((item) =>
      item.id === active.id ? { ...item, rank: newRank } : item,
    )
    setItems(updated)

    supabase
      .from('items')
      .update({ rank: newRank })
      .eq('id', active.id)
      .then(({ error: updateError }) => {
        if (updateError) refresh()
      })
  }

  if (loading) return <PageLoading />

  return (
    <section className="flex flex-col gap-4">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ShoppingBasket className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No saved items yet.</p>
          <Button type="button" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add a new item
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Items</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm((visible) => !visible)}
            >
              <Plus className="size-4" />
              New item
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Card>
                <CardContent className="flex flex-col">
                  {items.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator />}
                      <ItemRow item={item} onSaved={refresh} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </SortableContext>
          </DndContext>
        </>
      )}

      {showForm && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Label className="flex-col items-stretch gap-1.5">
                Item name
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Label>
              <Label className="flex-col items-stretch gap-1.5">
                Rough price (optional)
                <Input
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Label>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={submitting}>
                Add item
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
