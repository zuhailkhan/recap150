import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid } from '../../../core/panels'

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function pacificAtlantic(h: number[][], t: Tracer = noop): number[][] {
  const rows = h.length
  const cols = rows > 0 ? h[0].length : 0
  const cells = h.flatMap((row, r) => row.map((_, c) => [r, c]))

  // reach(starts): every cell whose water can run down to the coast cells in starts.
  // We go backwards: from the ocean inland, only to neighbours that are as high or higher.
  const reach = (name: string, starts: number[][]): boolean[][] => {
    const seen = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false))
    for (const [r, c] of starts) seen[r][c] = true // [1] coast cells touch the ocean
    let frontier = starts
    t.step(1, `${name}: the coast cells touch the ocean, so water there reaches it. Start the climb from them.`, [grid(h, { label: `reach the ${name}`, tones: h.map((row, i) => row.map((_, j) => (seen[i][j] ? 'focus' : null))) })])
    while (frontier.length > 0) {
      const next: number[][] = []
      for (const [r, c] of frontier) {
        for (const [dr, dc] of DIRS) {
          const nr = r + dr
          const nc = c + dc
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc]) continue // off the map or already known
          if (h[nr][nc] < h[r][c]) continue // [2] lower than where we stand: its water cannot climb up to us
          seen[nr][nc] = true // [2] this neighbour drains into (r, c), so it reaches the ocean too
          next.push([nr, nc])
        }
      }
      frontier = next
      t.step(2, next.length > 0 ? `Climb inland: ${next.length} new cell${next.length === 1 ? '' : 's'} (same height or higher) also reach the ${name}.` : `No neighbour is high enough. The climb from the ${name} stops.`, [grid(h, { label: `reach the ${name}`, tones: h.map((row, i) => row.map((_, j) => (seen[i][j] ? (next.some(([a, b]) => a === i && b === j) ? 'focus' : 'keep') : null))) })])
    }
    return seen
  }

  const pacific = reach('Pacific (top, left)', cells.filter(([r, c]) => r === 0 || c === 0))
  const atlantic = reach('Atlantic (bottom, right)', cells.filter(([r, c]) => r === rows - 1 || c === cols - 1))

  const both: number[][] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pacific[r][c] && atlantic[r][c]) both.push([r, c]) // [3] reaches both oceans
    }
  }
  t.step(3, `${both.length} cell${both.length === 1 ? '' : 's'} can be reached from both coasts. Those drain to both oceans.`, [grid(h, { label: 'reach both oceans', tones: h.map((row, i) => row.map((_, j) => (pacific[i][j] && atlantic[i][j] ? 'hit' : pacific[i][j] || atlantic[i][j] ? 'keep' : 'dim'))) })])
  return both
}
