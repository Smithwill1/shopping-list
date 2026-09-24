import { useState, type FormEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { validateItemName, validatePrice } from './validation'
import type { Item } from './useItems'
import { friendlyError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ItemRow({ item, onSaved }: { item: Item; onSaved: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(item.price === null ? '' : String(item.price))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const style = { transform: CSS.Transform.toString(transform), transition }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validateItemName(name) ?? validatePrice(price)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase
      .from('items')
      .update({ name: name.trim(), price: price.trim() ? Number(price) : null })
      .eq('id', item.id)
    setSubmitting(false)

    if (updateError) {
      setError(friendlyError(updateError, 'An item with this name already exists'))
      return
    }

    setEditing(false)
    onSaved()
  }

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className="py-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Label className="flex-col items-stretch gap-1.5">
            Item name
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Label>
          <Label className="flex-col items-stretch gap-1.5">
            Rough price (optional)
            <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" disabled={submitting}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-3">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${item.name}`}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex-1">{item.name}</span>
      {item.price !== null && (
        <span className="text-sm tabular-nums text-muted-foreground">${item.price.toFixed(2)}</span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Edit ${item.name}`}
        onClick={() => setEditing(true)}
      >
        <Pencil className="size-4" />
      </Button>
    </div>
  )
}
