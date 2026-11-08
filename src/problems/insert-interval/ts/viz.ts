// Trace-only drawing helpers. Never shown on the page.
import { intervals, type Panel, type Span, type Tone } from '../../../core/panels'

const spans = (xs: number[][], tone: (j: number) => Tone | undefined): Span[] => xs.map(([start, end], j) => ({ start, end, tone: tone(j) }))

/**
 * Top: the new interval (as it has grown so far) above the input. Handled input is dim, the one just handled is in focus.
 * Bottom: the result so far, with the new interval's slot (at) in hit.
 */
export function view(xs: number[][], i: number, focus: boolean, grown: number[], res: number[][], at: number, markAt: number, markName: string, final = false): Panel[] {
  const all = [grown, ...xs, ...res]
  const lo = Math.min(...all.map((s) => s[0]))
  const hi = Math.max(1, ...all.map((s) => s[1]))
  const top = [{ start: grown[0], end: grown[1], tone: 'hit' as Tone, label: `new [${grown}]` }, ...spans(xs, (j) => (j < i - 1 || (j === i - 1 && !focus) ? 'dim' : j === i - 1 ? 'focus' : undefined))]
  return [
    intervals(top, { label: 'new interval on top, then the input. Dashed line = the new start or the new end', min: lo, max: hi, marks: [{ at: markAt, label: `${markName} ${markAt}` }] }),
    intervals(spans(res, (j) => (final || j === at ? 'hit' : 'keep')), { label: 'result so far', min: lo, max: hi }),
  ]
}
