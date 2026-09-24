import { useSwipeable } from 'react-swipeable'
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
    <li {...handlers} className={item.done ? 'done' : ''}>
      <button
        type="button"
        aria-label={item.done ? `Mark ${item.name} as not bought` : `Mark ${item.name} as bought`}
        onClick={() => onToggle(item.id, !item.done)}
      >
        {item.done ? '✓' : '○'}
      </button>
      <span>{item.name}</span>
      {item.price !== null && <span>${item.price.toFixed(2)}</span>}
    </li>
  )
}
