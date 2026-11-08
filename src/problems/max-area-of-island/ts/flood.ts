import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid } from '../../../core/panels'

export function maxAreaOfIsland(land: number[][], t: Tracer = noop): number {
  const rows = land.length
  const cols = rows > 0 ? land[0].length : 0
  const owner = Array.from({ length: rows }, () => new Array<number>(cols).fill(0)) // [1] island number of each cell, 0 = not claimed yet
  t.step(1, 'No island owns anything yet. Scan for land with no owner and measure each island by flooding it.', [grid(land, { label: 'map (1 = land)' })])

  // area(r, c, id) claims every land cell connected to (r, c) and returns how many it claimed
  const area = (r: number, c: number, id: number): number => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return 0 // off the map
    if (land[r][c] !== 1 || owner[r][c] !== 0) return 0 // water, or already counted
    owner[r][c] = id // [3] claim this cell
    return 1 + area(r + 1, c, id) + area(r - 1, c, id) + area(r, c + 1, id) + area(r, c - 1, id) // [3] this cell plus what its neighbours add
  }

  let best = 0
  let islands = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (land[r][c] === 1 && owner[r][c] === 0) { // [2] unclaimed land: a new island starts here
        islands++
        t.step(2, `Land at (${r},${c}) with no owner: island ${islands} starts here. Flood it and add up its cells.`, [grid(land, { label: 'new island found', tones: land.map((row, i) => row.map((_, j) => (i === r && j === c ? 'focus' : owner[i][j] > 0 ? 'dim' : null))) })])
        const size = area(r, c, islands) // [3] flood and count
        t.step(3, `The flood claimed ${size} cell${size === 1 ? '' : 's'}. Island ${islands} has area ${size}.`, [grid(land, { label: `island ${islands}: area ${size}`, tones: land.map((row, i) => row.map((_, j) => (owner[i][j] === islands ? 'focus' : owner[i][j] > 0 ? 'dim' : null))) })])
        best = Math.max(best, size) // [4] keep the biggest area seen
        t.step(4, `Best area so far is ${best}. ${size === best ? 'This island matches or beats it.' : 'This island is smaller.'}`, [grid(land, { label: `best area so far: ${best}`, tones: land.map((row, i) => row.map((_, j) => { const o = owner[i][j]; return o === 0 ? null : owner.flat().filter((v) => v === o).length === best ? 'hit' : o === islands ? 'miss' : 'dim' })) })])
      }
    }
  }
  t.step(4, `Every cell is handled. The largest island has area ${best}.`, [grid(land, { label: `largest area: ${best}`, tones: land.map((row, i) => row.map((_, j) => (owner[i][j] > 0 && owner.flat().filter((v) => v === owner[i][j]).length === best ? 'hit' : owner[i][j] > 0 ? 'dim' : null))) })])
  return best // [4] 0 when there is no land at all
}
