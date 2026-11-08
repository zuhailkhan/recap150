// Trace-only drawing helpers. Never shown on the page.
import { heap, type Panel, type Tone } from '../../../core/panels'

/** The two halves. The tops are highlighted with tone. When the count is odd only the lower top is the median. */
export function show(lower: number[], upper: number[], tone: Tone | null, medianOnly = false): Panel[] {
  const oddLower = medianOnly && lower.length > upper.length
  return [
    heap(lower, { max: true, label: 'lower half: max-heap. Top = biggest of the small numbers', tones: lower.map((_, i): Tone | null => (i === 0 ? tone : null)) }),
    heap(upper, { label: 'upper half: min-heap. Top = smallest of the big numbers', tones: upper.map((_, i): Tone | null => (i === 0 && !oddLower ? tone : null)) }),
  ]
}
