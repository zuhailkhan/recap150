// Trace-only drawing helpers. Never shown on the page.
import { arr, heap, type Panel, type Tone } from '../../../core/panels'

/** The min-heap of the k biggest numbers, with one value highlighted and optionally the number just dropped. */
export function show(items: number[], k: number, hot?: number, tone: Tone = 'focus', dropped?: number): Panel[] {
  const at = hot === undefined ? -1 : items.indexOf(hot)
  const panels: Panel[] = [heap(items, { label: `min-heap of the ${k} biggest so far. The top is the answer`, tones: items.map((_, i): Tone | null => (i === at ? tone : null)) })]
  if (dropped !== undefined) panels.push(arr([dropped], { label: 'just dropped', tones: ['miss'] }))
  return panels
}

/** Quickselect view: the live window, the index the answer must end up at, and the pivot's final place. */
export function showQuick(a: number[], lo: number, hi: number, target: number, pivot?: number): Panel[] {
  const tones = a.map((_, i): Tone | null => (i === pivot ? 'focus' : i === target ? 'keep' : i < lo || i > hi ? 'dim' : null))
  return [arr(a, { label: `array. Window ${lo}..${hi}. The answer belongs at index ${target} (kept = target, focus = pivot, grey = out of play)`, tones, window: [lo, hi] })]
}
