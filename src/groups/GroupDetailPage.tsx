import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useItems } from '../items/useItems'
import { useGroup } from './useGroup'
import { useGroupItems } from '../group-items/useGroupItems'
import { GroupItemRow } from '../group-items/GroupItemRow'
import { AddItemToGroup } from '../group-items/AddItemToGroup'
import { validateGroupName } from './validation'
import { friendlyError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PageLoading } from '@/components/PageLoading'

export function GroupDetailPage({ householdId }: { householdId: string }) {
  const { id } = useParams()
  const groupId = id ?? ''

  const { group, loading: groupLoading, refresh: refreshGroup } = useGroup(groupId)
  const { items: catalogItems } = useItems(householdId)
  const { groupItems, loading, refresh, setGroupItems } = useGroupItems(groupId)

  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (groupLoading || loading) return <PageLoading />
  if (!group) return <p className="py-12 text-center text-muted-foreground">Group not found.</p>

  function startEditing() {
    setName(group?.name ?? '')
    setError(null)
    setEditingName(true)
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const nameError = validateGroupName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase
      .from('groups')
      .update({ name: name.trim() })
      .eq('id', groupId)
    setSubmitting(false)

    if (updateError) {
      setError(friendlyError(updateError, 'A group with this name already exists'))
      return
    }

    setEditingName(false)
    refreshGroup()
  }

  function removeItem(groupItemId: string) {
    setGroupItems(groupItems.filter((item) => item.id !== groupItemId))
    supabase
      .from('group_items')
      .delete()
      .eq('id', groupItemId)
      .then(({ error: deleteError }) => {
        if (deleteError) refresh()
      })
  }

  return (
    <section className="flex flex-col gap-4">
      {editingName ? (
        <Card>
          <CardContent>
            <form onSubmit={handleRename} className="flex flex-col gap-3">
              <Label className="flex-col items-stretch gap-1.5">
                Group name
                <Input value={name} onChange={(e) => setName(e.target.value)} />
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
                <Button type="button" variant="outline" onClick={() => setEditingName(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">{group.name}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Rename group"
            onClick={startEditing}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      )}

      {groupItems.length > 0 && (
        <Card>
          <CardContent className="flex flex-col">
            {groupItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator />}
                <GroupItemRow item={item} onRemove={removeItem} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AddItemToGroup
        groupId={groupId}
        catalogItems={catalogItems}
        groupItems={groupItems}
        onAdded={refresh}
      />
    </section>
  )
}
