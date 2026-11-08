// Trace-only drawing helpers. Never shown on the page.
import { arr, intervals, type Panel, type Tone } from '../../../core/panels'

export type Mode = 'none' | 'look' | 'clash' | 'done'

/**
 * Meetings sorted by start. i is the later meeting of the pair being checked.
 * look = the pair is in focus, clash = both miss, done = all fine (hit). The mark is the earlier meeting's end.
 */
export function view(sorted: number[][], i: number, mode: Mode): Panel[] {
  const lo = sorted.length > 0 ? Math.min(...sorted.map((s) => s[0])) : 0
  const hi = Math.max(1, ...sorted.map((s) => s[1]))
  const tone = (j: number): Tone | undefined => {
    if (mode === 'done') return 'hit'
    if (mode === 'none') return undefined
    if (j === i || j === i - 1) return mode === 'clash' ? 'miss' : 'focus'
    return j < i - 1 ? 'dim' : undefined
  }
  const marks = mode === 'look' || mode === 'clash' ? [{ at: sorted[i - 1][1], label: `end ${sorted[i - 1][1]}` }] : []
  const checked = mode === 'done' ? Math.max(0, sorted.length - 1) : mode === 'none' ? 0 : i - 1
  const items: string[] = Array.from({ length: checked }, () => 'ok')
  const tones: Tone[] = items.map(() => 'hit')
  if (mode === 'clash') {
    items.push('clash')
    tones.push('miss')
  }
  if (items.length === 0) items.push('none yet')
  return [
    intervals(sorted.map(([start, end], j) => ({ start, end, tone: tone(j) })), { label: 'sorted by start. Dashed line = end of the earlier meeting', min: lo, max: hi, marks }),
    arr(items, { label: 'neighbour pairs checked', tones: items.length === 1 && items[0] === 'none yet' ? [null] : tones }),
  ]
}
