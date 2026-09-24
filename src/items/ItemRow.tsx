import { useState, type FormEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabaseClient'
import { validateItemName, validatePrice } from './validation'
import type { Item } from './useItems'

function formatPrice(price: number | null): string | null {
  return price === null ? null : `$${price.toFixed(2)}`
}

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
      setError(
        updateError.code === '23505'
          ? 'An item with this name already exists'
          : updateError.message,
      )
      return
    }

    setEditing(false)
    onSaved()
  }

  if (editing) {
    return (
      <li ref={setNodeRef} style={style}>
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
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      </li>
    )
  }

  return (
    <li ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} aria-label={`Drag to reorder ${item.name}`}>
        ⠿
      </span>
      <span>{item.name}</span>
      {item.price !== null && <span>{formatPrice(item.price)}</span>}
      <button type="button" onClick={() => setEditing(true)}>
        Edit
      </button>
    </li>
  )
}
