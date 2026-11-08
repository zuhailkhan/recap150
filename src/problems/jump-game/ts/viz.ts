// Trace-only helper. Not shown on the page.
import type { Tones } from '../../../core/panels'

/** Cells up to far are reachable (keep). Cells before i are dim, i is in focus. */
export const reachTones = (n: number, i: number, far: number): Tones =>
  Array.from({ length: n }, (_, k) => (k === i ? 'focus' : k < i ? 'dim' : k <= far ? 'keep' : null))
