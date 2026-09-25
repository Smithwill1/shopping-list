import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm text-destructive-foreground">
      <WifiOff className="size-4" />
      You're offline — changes won't sync until you're back online.
    </div>
  )
}
