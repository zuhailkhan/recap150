// Trace-only helper. Not shown on the page.
import { arr, type ArrayPanel, type Tone } from '../../../core/panels'

/** A number line of possible open counts with [lo, hi] bracketed. Capped at 12 cells so long strings stay readable. */
export function openRange(lo: number, hi: number, n: number, tone: Tone = 'keep'): ArrayPanel {
  const top = Math.min(Math.max(n, 1), 12)
  const items = Array.from({ length: top + 1 }, (_, k) => k)
  const a = Math.max(lo, 0)
  const b = Math.min(hi, top)
  if (b < a) return arr(items, { label: 'possible open counts (none)', tones: items.map(() => 'miss' as const) })
  return arr(items, { label: 'possible open counts (bracket = [lo, hi])', tones: items.map((k) => (k >= a && k <= b ? tone : null)), window: [a, b] })
}
