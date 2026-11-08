// Trace-only drawing helpers. Never shown on the page.
import { arr, heap, type Panel, type Tone } from '../../../core/panels'
import type { Entry } from './heap'

/** Points in input order (kept = in the heap, evicted = dim), and the heap of squared distances. */
export function show(points: number[][], items: Entry[], at: number, evicted?: Entry, done = false): Panel[] {
  const kept = new Set(items.map((e) => e.p))
  const tones = points.map((p, i): Tone | null => (done ? (kept.has(p) ? 'hit' : 'dim') : i === at ? 'focus' : i < at ? (kept.has(p) ? 'keep' : 'dim') : null))
  const ev = evicted ? `. Just evicted: (${evicted.p[0]}, ${evicted.p[1]})` : ''
  return [
    arr(points.map((p) => `(${p[0]},${p[1]})`), { label: `points${ev}`, tones }),
    heap(items.map((e) => e.d), { max: true, label: 'max-heap of squared distances. The farthest kept point is on top', tones: items.map((_, i): Tone | null => (done ? 'hit' : i === 0 ? 'focus' : null)) }),
  ]
}
