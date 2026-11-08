import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid } from '../../../core/panels'

export function numIslands(land: string[][], t: Tracer = noop): number {
  const rows = land.length
  const cols = rows > 0 ? land[0].length : 0
  const island = Array.from({ length: rows }, () => new Array<number>(cols).fill(0)) // [1] island number of each cell, 0 = not claimed yet
  t.step(1, 'Nothing is claimed yet. Scan in reading order and look for land that no island owns.', [grid(land, { label: 'map (1 = land, 0 = water)' })])

  const flood = (r: number, c: number, id: number): void => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return // off the map
    if (land[r][c] !== '1' || island[r][c] !== 0) return // water, or already claimed
    island[r][c] = id // [3] claim this cell for the island
    t.step(3, `Claim (${r},${c}) for island ${id}, then try its four neighbours.`, [grid(land, { label: `flooding island ${id}`, tones: land.map((row, i) => row.map((_, j) => (i === r && j === c ? 'focus' : island[i][j] === id ? 'keep' : island[i][j] > 0 ? 'hit' : null))) })])
    flood(r + 1, c, id)
    flood(r - 1, c, id)
    flood(r, c + 1, id)
    flood(r, c - 1, id)
  }

  let count = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (land[r][c] === '1' && island[r][c] === 0) { // [2] unclaimed land: a new island starts here
        count++
        t.step(2, `Land at (${r},${c}) that nobody owns. That is island number ${count}. Flood it.`, [grid(land, { label: 'new island found', tones: land.map((row, i) => row.map((_, j) => (i === r && j === c ? 'focus' : island[i][j] > 0 ? 'hit' : null))) })])
        flood(r, c, count)
      }
    }
  }
  t.step(4, `The scan is over. Every land cell belongs to an island, so the answer is ${count}.`, [grid(land, { label: 'all islands', tones: land.map((row, i) => row.map((_, j) => (island[i][j] > 0 ? 'hit' : null))) })])
  return count // [4] one count per flood that had to be started
}
