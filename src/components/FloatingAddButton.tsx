import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Sits above the fixed bottom tab bar, aligned to the right edge of the
// centered content column (not the raw viewport edge) — the same
// full-width-wrapper-plus-centered-inner-container technique Home.tsx's
// tab bar already uses, so the button lines up with the content on any
// screen width instead of drifting to the browser window's true edge on
// a wide viewport.
export function FloatingAddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20">
      <div className="relative mx-auto max-w-[480px]">
        <Button
          type="button"
          size="icon"
          aria-label={label}
          onClick={onClick}
          className="pointer-events-auto absolute right-4 size-14 rounded-full shadow-lg"
        >
          <Plus className="size-6" />
        </Button>
      </div>
    </div>
  )
}
