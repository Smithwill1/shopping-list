import { useCallback, useEffect, useRef, useState } from 'react'

// Shared "fetch on key change" hook, extracted after the same
// fetch-on-mount pattern (and its accepted set-state-in-effect lint
// warning — see docs/phase-02-auth-households.md Step 11) showed up a
// third time. A null key means "nothing to fetch yet" (e.g. no session):
// loading starts false and the effect does nothing, rather than every
// caller re-deriving that case itself.
export function useAsyncData<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>,
  initial: T,
) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(key !== null)
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (key === null) return

    setLoading(true)
    fetcherRef
      .current(key)
      .then((result) => {
        setData(result)
      })
      .catch(() => {
        // A rejected fetch (e.g. offline) still has to stop the spinner —
        // the OfflineBanner is what tells the user why, not this hook.
      })
      .finally(() => {
        setLoading(false)
      })
  }, [key])

  const refresh = useCallback(async () => {
    if (key === null) return
    setLoading(true)
    try {
      const result = await fetcherRef.current(key)
      setData(result)
    } catch {
      // Same reasoning as above — stop loading, leave the last-known data.
    } finally {
      setLoading(false)
    }
  }, [key])

  return { data, loading, refresh, setData }
}
