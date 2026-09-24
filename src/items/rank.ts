// Fractional-index ranking: a new item goes RANK_STEP past the current
// last item, and a dragged item takes the midpoint of its new neighbours'
// ranks. Neither case ever needs to touch another row's rank.
const RANK_STEP = 1000

export function nextRank(items: { rank: number }[]): number {
  if (items.length === 0) return RANK_STEP
  return Math.max(...items.map((item) => item.rank)) + RANK_STEP
}

export function rankBetween(before: number | undefined, after: number | undefined): number {
  if (before !== undefined && after !== undefined) return (before + after) / 2
  if (before !== undefined) return before + RANK_STEP
  if (after !== undefined) return after - RANK_STEP
  return RANK_STEP
}
