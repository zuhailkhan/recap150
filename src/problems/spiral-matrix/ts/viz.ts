// Trace-only drawing helpers. Never shown on the page.
import { dp, type Panel, type Tone } from '../../../core/panels'

type Box = [top: number, bottom: number, left: number, right: number]

/** Tones for the matrix. Cells outside the live box are done (dim). Cells in `now` are the side just walked (focus). */
export function spiralTones(rows: number, cols: number, live: Box, now: Box | null): (Tone | null)[][] {
  const inside = (r: number, c: number, b: Box) => r >= b[0] && r <= b[1] && c >= b[2] && c <= b[3]
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c): Tone | null => (now && inside(r, c, now) ? 'focus' : inside(r, c, live) ? null : 'dim')))
}

/** The four fences as one small row. The fence that just moved is in focus. */
export function fences(top: number, bottom: number, left: number, right: number, hot?: 'top' | 'bottom' | 'left' | 'right'): Panel {
  const names = ['top', 'bottom', 'left', 'right']
  return dp([[top, bottom, left, right]], { label: 'fences', colLabels: names, tones: [names.map((n): Tone | null => (n === hot ? 'focus' : null))] })
}
