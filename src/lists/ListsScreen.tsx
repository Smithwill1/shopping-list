import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { useLists } from './useLists'
import { validateListName } from './validation'

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

  if (loading) return <p>Loading…</p>

  return (
    <section>
      {lists.length === 0 ? (
        <div>
          <p>No lists yet.</p>
          <button type="button" onClick={() => setShowForm(true)}>
            Create your first list
          </button>
        </div>
      ) : (
        <>
          <div>
            <h2>Lists</h2>
            <button type="button" onClick={() => setShowForm((visible) => !visible)}>
              + New list
            </button>
          </div>
          <ul>
            {lists.map((list) => (
              <li key={list.id}>
                <Link to={`/lists/${list.id}`}>
                  <strong>{list.name}</strong>
                  {list.description && <p>{list.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {showForm && (
        <form onSubmit={handleSubmit}>
          <label>
            List name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Description (optional)
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>
            Create
          </button>
        </form>
      )}
    </section>
  )
}
