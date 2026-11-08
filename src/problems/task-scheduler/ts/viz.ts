// Trace-only drawing helpers. Never shown on the page.
import { arr, heap, type Panel, type Tone } from '../../../core/panels'
import type { Rest, Slot } from './heap'

const label = (s: Slot): string => `${s.task}x${s.left}`

/** The timeline so far, the ready heap, and the resting tasks. hot marks the task that just moved. */
export function show(ready: Slot[], cooling: Rest[], timeline: string[], hot?: Slot, done = false): Panel[] {
  const line = timeline.map((x, i): Tone => (x === 'idle' ? 'miss' : i === timeline.length - 1 && !done ? 'focus' : 'keep'))
  const panels: Panel[] = []
  if (timeline.length) panels.push(arr(timeline, { label: 'time line: one slot per time unit', tones: line }))
  panels.push(heap(ready.map(label), { max: true, label: 'ready: may run now. Most copies left on top', tones: ready.map((s, i): Tone | null => (s === hot ? 'focus' : i === 0 && !hot ? 'focus' : null)) }))
  if (cooling.length) panels.push(arr(cooling.map((c) => `${label(c.slot)} back at ${c.back}`), { label: 'resting: not allowed yet', tones: cooling.map((c): Tone => (c.slot === hot ? 'focus' : 'dim')) }))
  return panels
}
