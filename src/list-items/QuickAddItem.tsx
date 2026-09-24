import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { validateNewItemName } from './validation'
import { nextRank } from '../items/rank'
import type { Item } from '../items/useItems'

export function QuickAddItem({
  householdId,
  listId,
  existingItems,
  onAdded,
}: {
  householdId: string
  listId: string
  existingItems: Item[]
  onAdded: () => void
}) {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function addToListOnly(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const nameError = validateNewItemName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase
      .from('list_items')
      .insert({ list_id: listId, name: name.trim(), created_by: session?.user.id })
    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setName('')
    onAdded()
  }

  async function addAndSaveForLater() {
    setError(null)
    const nameError = validateNewItemName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    setSubmitting(true)

    const { data: created, error: itemError } = await supabase
      .from('items')
      .insert({
        household_id: householdId,
        name: name.trim(),
        rank: nextRank(existingItems),
        created_by: session?.user.id,
      })
      .select('id')
      .single()

    let itemId = created?.id ?? null

    // Someone (possibly your partner) already saved an item with this
    // name — reuse it instead of failing, since the intent ("make sure
    // this is in the catalog for later") is already satisfied.
    if (itemError?.code === '23505') {
      const { data: existing } = await supabase
        .from('items')
        .select('id')
        .eq('household_id', householdId)
        .ilike('name', name.trim())
        .maybeSingle()
      itemId = existing?.id ?? null
    } else if (itemError) {
      setSubmitting(false)
      setError(itemError.message)
      return
    }

    if (!itemId) {
      setSubmitting(false)
      setError('Could not save this item to your catalog')
      return
    }

    const { error: listItemError } = await supabase
      .from('list_items')
      .insert({ list_id: listId, item_id: itemId, created_by: session?.user.id })
    setSubmitting(false)

    if (listItemError) {
      setError(listItemError.message)
      return
    }

    setName('')
    onAdded()
  }

  return (
    <form onSubmit={addToListOnly}>
      <label>
        Add an item
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type an item name…"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        Add to list
      </button>
      <button type="button" onClick={addAndSaveForLater} disabled={submitting}>
        Add + save for later
      </button>
    </form>
  )
}
