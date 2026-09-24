import { Loader2 } from 'lucide-react'

export function PageLoading() {
  return (
    <div className="flex justify-center py-12 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" aria-label="Loading" />
    </div>
  )
}
