// Trace-only helper. Not shown on the page.
import type { Tone, Tones } from '../../../core/panels'

/** Earlier parts are dim. The current part from start to i uses the given tone, with i in focus when it is keep. */
export const partTones = (n: number, start: number, i: number, tone: Tone): Tones =>
  Array.from({ length: n }, (_, k) => (k < start ? 'dim' : k === i && tone === 'keep' ? 'focus' : k <= i ? tone : null))
