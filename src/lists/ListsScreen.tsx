import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { useLists } from './useLists'
import { validateListName } from './validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PageLoading } from '@/components/PageLoading'
import { FloatingAddButton } from '@/components/FloatingAddButton'

export function ListsScreen({ householdId }: { householdId: string }) {
  const { session } = useAuth()
  const { lists, loading, refresh } = useLists(householdId)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setName('')
      setDescription('')
      setError(null)
    }
  }

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

    handleOpenChange(false)
    refresh()
  }

  if (loading) return <PageLoading />

  return (
    <section className="flex flex-col gap-4">
      {lists.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No lists yet.</p>
          <p className="text-sm text-muted-foreground">Tap + to create one.</p>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold">Lists</h2>
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

      <FloatingAddButton label="Add a new list" onClick={() => setOpen(true)} />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new list</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Label className="flex-col items-stretch gap-1.5">
              List name
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
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
        </DialogContent>
      </Dialog>
    </section>
  )
}
