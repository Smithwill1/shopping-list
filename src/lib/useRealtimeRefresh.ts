import { useEffect } from 'react'
import { supabase } from './supabaseClient'

// Subscribes to Postgres change events (insert/update/delete) on one table,
// scoped by a Realtime filter string (e.g. `list_id=eq.<uuid>`), and calls
// `onChange` whenever a matching row changes — including changes made by
// your partner's device, which is the actual point. A `null` filter means
// there's nothing to scope the subscription to yet (e.g. no list selected),
// so it's skipped rather than subscribing to every row in the table.
export function useRealtimeRefresh(table: string, filter: string | null, onChange: () => void) {
  useEffect(() => {
    if (filter === null) return

    const channel = supabase
      .channel(`${table}:${filter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => {
        onChange()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, onChange])
}
