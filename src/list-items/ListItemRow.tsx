import { Minus, Plus } from 'lucide-react'
import { useSwipeable } from 'react-swipeable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from 'cn'
import type { ListItem } from './useListItems'

export function ListItemRow({
  item,
  onToggle,
  onRemove,
  onQuantityChange,
}: {
  item: ListItem
  onToggle: (id: string, done: boolean) => void
  onRemove: (id: string) => void
  onQuantityChange: (id: string, quantity: number) => void
}) {
  const handlers = useSwipeable({
    onSwipedLeft: () => onRemove(item.id),
    trackMouse: true,
  })

  function decrement() {
    if (item.quantity <= 1) {
      onRemove(item.id)
      return
    }
    onQuantityChange(item.id, item.quantity - 1)
  }

  function increment() {
    onQuantityChange(item.id, item.quantity + 1)
  }

  const lineTotal = item.price === null ? null : item.price * item.quantity

  return (
    <div {...handlers} className="flex items-center gap-2 py-3">
      <Checkbox
        checked={item.done}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        aria-label={item.done ? `Mark ${item.name} as not bought` : `Mark ${item.name} as bought`}
      />
      <span className={cn('flex-1 truncate', item.done && 'text-muted-foreground line-through')}>
        {item.name}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          aria-label={
            item.quantity <= 1 ? `Remove ${item.name}` : `Decrease quantity of ${item.name}`
          }
          onClick={decrement}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-4 text-center text-sm tabular-nums">{item.quantity}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          aria-label={`Increase quantity of ${item.name}`}
          onClick={increment}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      {lineTotal !== null && (
        <span className="w-14 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          ${lineTotal.toFixed(2)}
        </span>
      )}
    </div>
  )
}
