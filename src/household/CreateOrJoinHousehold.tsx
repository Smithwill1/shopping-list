import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { validateHouseholdName, validateInviteCode } from './validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">🛒 Shopping List</h1>
        <p className="mt-1 text-sm text-muted-foreground">You're not part of a household yet.</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <h2 className="text-xl font-medium leading-snug">Get started</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === 'create' ? 'default' : 'outline'}
              onClick={() => setMode('create')}
            >
              Create a household
            </Button>
            <Button
              type="button"
              variant={mode === 'join' ? 'default' : 'outline'}
              onClick={() => setMode('join')}
            >
              Join with a code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'create' ? (
              <Label className="flex-col items-stretch gap-1.5">
                Household name
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Label>
            ) : (
              <Label className="flex-col items-stretch gap-1.5">
                Invite code
                <Input value={code} onChange={(e) => setCode(e.target.value)} />
              </Label>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="mt-1 w-full">
              {mode === 'create' ? 'Create' : 'Join'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
