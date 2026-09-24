import { useSwipeable } from 'react-swipeable'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from 'cn'
import type { ListItem } from './useListItems'

export function ListItemRow({
  item,
  onToggle,
  onRemove,
}: {
  item: ListItem
  onToggle: (id: string, done: boolean) => void
  onRemove: (id: string) => void
}) {
  const handlers = useSwipeable({
    onSwipedLeft: () => onRemove(item.id),
    trackMouse: true,
  })

  return (
    <div {...handlers} className="flex items-center gap-3 py-3">
      <Checkbox
        checked={item.done}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        aria-label={item.done ? `Mark ${item.name} as not bought` : `Mark ${item.name} as bought`}
      />
      <span className={cn('flex-1', item.done && 'text-muted-foreground line-through')}>
        {item.name}
      </span>
      {item.price !== null && (
        <span className="text-sm tabular-nums text-muted-foreground">${item.price.toFixed(2)}</span>
      )}
    </div>
  )
}
