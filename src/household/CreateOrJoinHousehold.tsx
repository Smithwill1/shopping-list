import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { validateHouseholdName, validateInviteCode } from './validation'

type Mode = 'create' | 'join'

export function CreateOrJoinHousehold({ onJoined }: { onJoined: () => void }) {
  const [mode, setMode] = useState<Mode>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'create') {
      const nameError = validateHouseholdName(name)
      if (nameError) {
        setError(nameError)
        return
      }

      setSubmitting(true)
      const { error: rpcError } = await supabase.rpc('create_household', { p_name: name })
      setSubmitting(false)
      if (rpcError) {
        setError(rpcError.message)
        return
      }
    } else {
      const codeError = validateInviteCode(code)
      if (codeError) {
        setError(codeError)
        return
      }

      setSubmitting(true)
      const { error: rpcError } = await supabase.rpc('redeem_invite', { p_code: code.trim() })
      setSubmitting(false)
      if (rpcError) {
        setError(rpcError.message)
        return
      }
    }

    onJoined()
  }

  return (
    <main>
      <header>
        <h1>🛒 Shopping List</h1>
      </header>
      <p>You're not part of a household yet.</p>
      <div>
        <button type="button" onClick={() => setMode('create')} disabled={mode === 'create'}>
          Create a household
        </button>
        <button type="button" onClick={() => setMode('join')} disabled={mode === 'join'}>
          Join with an invite code
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        {mode === 'create' ? (
          <label>
            Household name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        ) : (
          <label>
            Invite code
            <input value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {mode === 'create' ? 'Create' : 'Join'}
        </button>
      </form>
    </main>
  )
}
