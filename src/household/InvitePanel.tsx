import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // excludes 0/O/1/I to avoid ambiguity

function randomCode(length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

export function InvitePanel({ householdId }: { householdId: string }) {
  const { session } = useAuth()
  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function generateInvite() {
    if (!session) return

    setGenerating(true)
    setError(null)
    const newCode = randomCode()
    const { error: insertError } = await supabase.from('household_invites').insert({
      household_id: householdId,
      code: newCode,
      created_by: session.user.id,
    })
    setGenerating(false)

    if (insertError) {
      setError('Could not generate an invite code — try again')
      return
    }
    setCode(newCode)
  }

  return (
    <section>
      <h2>Invite your partner</h2>
      <button type="button" onClick={generateInvite} disabled={generating}>
        Generate invite code
      </button>
      {code && (
        <p>
          Share this code: <strong>{code}</strong> (expires in 7 days)
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
