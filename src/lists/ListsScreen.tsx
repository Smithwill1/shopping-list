import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { useLists } from './useLists'
import { validateListName } from './validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PageLoading } from '@/components/PageLoading'

export function ListsScreen({ householdId }: { householdId: string }) {
  const { session } = useAuth()
  const { lists, loading, refresh } = useLists(householdId)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const nameError = validateListName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('lists').insert({
      household_id: householdId,
      name: name.trim(),
      description: description.trim() || null,
      created_by: session?.user.id,
    })
    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setName('')
    setDescription('')
    setShowForm(false)
    refresh()
  }

  if (loading) return <PageLoading />

  return (
    <section className="flex flex-col gap-4">
      {lists.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No lists yet.</p>
          <Button type="button" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Create your first list
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lists</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm((visible) => !visible)}
            >
              <Plus className="size-4" />
              New list
            </Button>
          </div>
          <Card>
            <CardContent className="flex flex-col">
              {lists.map((list, index) => (
                <div key={list.id}>
                  {index > 0 && <Separator />}
                  <Link
                    to={`/lists/${list.id}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-medium">{list.name}</p>
                      {list.description && (
                        <p className="text-sm text-muted-foreground">{list.description}</p>
                      )}
                    </div>
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
                List name
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Label>
              <Label className="flex-col items-stretch gap-1.5">
                Description (optional)
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
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
