import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { useGroups } from './useGroups'
import { validateGroupName } from './validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PageLoading } from '@/components/PageLoading'

export function GroupsScreen({ householdId }: { householdId: string }) {
  const { session } = useAuth()
  const { groups, loading, refresh } = useGroups(householdId)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const nameError = validateGroupName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('groups').insert({
      household_id: householdId,
      name: name.trim(),
      created_by: session?.user.id,
    })
    setSubmitting(false)

    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'A group with this name already exists'
          : insertError.message,
      )
      return
    }

    setName('')
    setShowForm(false)
    refresh()
  }

  if (loading) return <PageLoading />

  return (
    <section className="flex flex-col gap-4">
      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ChefHat className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No groups yet.</p>
          <Button type="button" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Create your first group
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Groups</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm((visible) => !visible)}
            >
              <Plus className="size-4" />
              New group
            </Button>
          </div>
          <Card>
            <CardContent className="flex flex-col">
              {groups.map((group, index) => (
                <div key={group.id}>
                  {index > 0 && <Separator />}
                  <Link
                    to={`/groups/${group.id}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <p className="font-medium">{group.name}</p>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {showForm && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Label className="flex-col items-stretch gap-1.5">
                Group name
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Label>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={submitting}>
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
