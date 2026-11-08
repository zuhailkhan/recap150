// Trace-only drawing helpers. Never shown on the page.
import { grid as gridPanel, heap as heapPanel, type Panel, type Tone } from '../../../core/panels'

/** Flooded cells (already popped) are dim, cells waiting in the heap are kept, the current cell is in focus. */
export function show(grid: number[][], seen: boolean[][], items: [number, number, number][], r: number, c: number, level: number, done: boolean): Panel[] {
  const waiting = new Set(items.map(([, a, b]) => `${a},${b}`))
  const tones = grid.map((row, i) => row.map((_, j): Tone | null => {
    if (i === r && j === c) return done ? 'hit' : 'focus'
    if (!seen[i][j]) return null
    return waiting.has(`${i},${j}`) ? 'keep' : 'dim'
  }))
  const panels: Panel[] = [gridPanel(grid, { tones, label: `water level so far: ${level}. Grey = flooded, shaded = waiting in the heap` })]
  if (items.length) panels.push(heapPanel(items.map(([l, a, b]) => `${l}@${a},${b}`), { label: 'heap of level@row,col. Lowest level on top', tones: items.map((_, i): Tone | null => (i === 0 ? 'focus' : null)) }))
  return panels
}
