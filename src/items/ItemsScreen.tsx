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
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { useItems } from './useItems'
import { ItemRow } from './ItemRow'
import { validateItemName, validatePrice } from './validation'
import { nextRank, rankBetween } from './rank'

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

  if (loading) return <p>Loading…</p>

  return (
    <section>
      {items.length === 0 ? (
        <div>
          <p>No saved items yet.</p>
          <button type="button" onClick={() => setShowForm(true)}>
            Add a new item
          </button>
        </div>
      ) : (
        <>
          <div>
            <h2>Items</h2>
            <button type="button" onClick={() => setShowForm((visible) => !visible)}>
              + New item
            </button>
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
              <ul>
                {items.map((item) => (
                  <ItemRow key={item.id} item={item} onSaved={refresh} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}

      {showForm && (
        <form onSubmit={handleSubmit}>
          <label>
            Item name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Rough price (optional)
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>
            Add item
          </button>
        </form>
      )}
    </section>
  )
}
