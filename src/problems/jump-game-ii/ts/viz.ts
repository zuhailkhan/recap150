// Trace-only helper. Not shown on the page.
import type { Tones } from '../../../core/panels'

/** Cells before i are dim, i is in focus, cells after i up to end are still in the current window (keep). */
export const windowTones = (n: number, i: number, end: number): Tones =>
  Array.from({ length: n }, (_, k) => (k === i ? 'focus' : k < i ? 'dim' : k <= end ? 'keep' : null))
