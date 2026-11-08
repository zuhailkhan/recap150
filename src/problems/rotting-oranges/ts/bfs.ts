import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid } from '../../../core/panels'

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function orangesRotting(oranges: number[][], t: Tracer = noop): number {
  const g = oranges.map((row) => [...row]) // work on a copy so the input stays as it was
  let queue: number[][] = [] // rotten oranges that may rot a neighbour next minute
  let fresh = 0
  for (let r = 0; r < g.length; r++) {
    for (let c = 0; c < g[r].length; c++) {
      if (g[r][c] === 2) queue.push([r, c]) // [1] every rotten orange starts the spread at minute 0
      else if (g[r][c] === 1) fresh++ // [1] count the fresh ones we must reach
    }
  }
  t.step(1, `${queue.length} rotten orange${queue.length === 1 ? '' : 's'} start together. ${fresh} fresh to reach.`, [grid(g, { label: 'minute 0 (2 rotten, 1 fresh, 0 empty)', tones: g.map((row) => row.map((v) => (v === 2 ? 'focus' : v === 0 ? 'dim' : null))) })])

  let minutes = 0
  while (queue.length > 0 && fresh > 0) {
    const next: number[][] = []
    for (const [r, c] of queue) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nr >= g.length || nc < 0 || nc >= g[nr].length) continue // off the grid
        if (g[nr][nc] !== 1) continue // empty or already rotten
        g[nr][nc] = 2 // [2] a fresh neighbour rots this minute
        fresh--
        next.push([nr, nc])
      }
    }
    queue = next
    minutes++ // [2] one whole wave = one minute
    t.step(2, `Minute ${minutes}: ${next.length} fresh orange${next.length === 1 ? '' : 's'} rot${next.length === 1 ? 's' : ''}. ${fresh} fresh left.`, [grid(g, { label: `minute ${minutes}`, tones: g.map((row, i) => row.map((v, j) => (v === 2 ? (next.some(([a, b]) => a === i && b === j) ? 'focus' : 'keep') : v === 0 ? 'dim' : null))) })])
  }

  t.step(3, fresh === 0 ? `No fresh orange is left. It took ${minutes} minute${minutes === 1 ? '' : 's'}.` : `${fresh} fresh orange${fresh === 1 ? ' is' : 's are'} cut off from every rotten one. Impossible.`, [grid(g, { label: fresh === 0 ? 'all rotten' : 'some stay fresh', tones: g.map((row) => row.map((v) => (v === 2 ? (fresh === 0 ? 'hit' : 'keep') : v === 1 ? 'miss' : 'dim'))) })])
  return fresh === 0 ? minutes : -1 // [3] -1 if any fresh orange could not be reached
}
