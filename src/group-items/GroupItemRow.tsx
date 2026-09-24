import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GroupItem } from './useGroupItems'

export function GroupItemRow({
  item,
  onRemove,
}: {
  item: GroupItem
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex-1">{item.name}</span>
      {item.price !== null && (
        <span className="text-sm tabular-nums text-muted-foreground">${item.price.toFixed(2)}</span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove ${item.name} from group`}
        onClick={() => onRemove(item.id)}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
