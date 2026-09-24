import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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
    <Card>
      <CardHeader>
        <h3 className="text-base font-medium leading-snug">Invite your partner</h3>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button type="button" variant="secondary" onClick={generateInvite} disabled={generating}>
          Generate invite code
        </Button>
        {code && (
          <p className="text-sm">
            Share this code: <strong className="font-mono text-base tracking-wider">{code}</strong>{' '}
            (expires in 7 days)
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
