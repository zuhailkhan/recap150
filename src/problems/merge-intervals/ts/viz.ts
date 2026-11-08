// Trace-only drawing helpers. Never shown on the page.
import { intervals, type Panel, type Span, type Tone } from '../../../core/panels'

const spans = (xs: number[][], tone: (j: number) => Tone | undefined): Span[] => xs.map(([start, end], j) => ({ start, end, tone: tone(j) }))

/** The sorted input (done = dim, current = focus), a mark at the last merged end, and the merged result so far. */
export function view(sorted: number[][], i: number, res: number[][], final = false): Panel[] {
  const lo = sorted.length > 0 ? Math.min(...sorted.map((s) => s[0])) : 0
  const hi = Math.max(1, ...sorted.map((s) => s[1]))
  const last = res[res.length - 1]
  const marks = last && !final ? [{ at: last[1], label: `end ${last[1]}` }] : []
  return [
    intervals(spans(sorted, (j) => (j < i ? 'dim' : j === i ? 'focus' : undefined)), { label: 'sorted by start. Dashed line = end of the last merged interval', min: lo, max: hi, marks }),
    intervals(spans(res, (j) => (final || j === res.length - 1 ? 'hit' : 'keep')), { label: 'merged so far', min: lo, max: hi }),
  ]
}
