// Trace-only drawing helpers. Never shown on the page.
import { arr, heap, type Panel, type Tone } from '../../../core/panels'

/** The heap of stones. pair = the two just smashed. left = what survived (0 means both vanished). */
export function show(items: number[], pair?: [number, number], left?: number, done = false): Panel[] {
  const survivor = left !== undefined && left > 0
  const tones = items.map((_, i): Tone | null => (done ? 'hit' : i === 0 && !pair ? 'focus' : survivor && i === items.indexOf(left) ? 'keep' : null))
  const panels: Panel[] = [heap(items, { max: true, label: 'max-heap of stones. The heaviest is on top', tones })]
  if (pair) {
    const tone: Tone = left === undefined ? 'focus' : survivor ? 'dim' : 'miss'
    panels.push(arr(pair, { label: left === undefined ? 'the two heaviest' : survivor ? 'smashed (the leftover went back)' : 'smashed (both vanish)', tones: [tone, tone] }))
  }
  return panels
}
