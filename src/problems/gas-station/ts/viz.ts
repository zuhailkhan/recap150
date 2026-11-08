// Trace-only helper. Not shown on the page.
import type { Tone, Tones } from '../../../core/panels'

/** Stations before the start are dim (skipped). The trip from start to i uses the given tone, with i in focus when it is keep. */
export const tripTones = (n: number, start: number, i: number, tone: Tone): Tones =>
  Array.from({ length: n }, (_, k) => (k < start ? 'dim' : k === i && tone === 'keep' ? 'focus' : k <= i ? tone : null))

/** Net fuel at each station: gas minus cost. */
export const gainsOf = (gas: number[], cost: number[]): number[] => gas.map((g, i) => g - cost[i])
