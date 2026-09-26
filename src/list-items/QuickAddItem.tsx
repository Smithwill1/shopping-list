import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { validateItemName } from '../items/validation'
import { nextRank } from '../items/rank'
import type { Item } from '../items/useItems'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    const nameError = validateItemName(name)
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
    const nameError = validateItemName(name)
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
    <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20">
      <div className="mx-auto max-w-[480px] px-4">
        <Card className="shadow-lg">
          <CardContent>
            <form onSubmit={addToListOnly} className="flex flex-col gap-3">
              <Label className="flex-col items-stretch gap-1.5">
                Add an item
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Type an item name…"
                />
              </Label>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button type="submit" disabled={submitting}>
                  Add to list
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAndSaveForLater}
                  disabled={submitting}
                >
                  Add + save for later
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
