// Trace-only helper. Not shown on the page.
import { grid, type GridPanel, type Tone } from '../../../core/panels'

/**
 * The triplets as a grid. Rows before i are finished, row i is current, rows after i are untouched.
 * Cells above the target are miss, cells equal to the target are hit. A discarded row has all its cells dimmed in tone miss.
 */
export function board(triplets: number[][], target: number[], i: number): GridPanel {
  const tones = triplets.map((tri, r) => {
    if (r > i) return tri.map(() => null)
    const bad = tri.some((v, j) => v > target[j])
    return tri.map((v, j): Tone | null => (v > target[j] ? 'miss' : bad ? 'dim' : v === target[j] ? 'hit' : r === i ? 'focus' : 'keep'))
  })
  return grid(triplets, { label: 'triplets (red = above target, green = equals target)', tones })
}
