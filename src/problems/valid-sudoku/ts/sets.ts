import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { buckets, grid } from '../../../core/panels'

export function isValidSudoku(board: string[][], t: Tracer = noop): boolean {
  const rows = Array.from({ length: 9 }, () => new Set<string>()) // [1] digits seen in each row
  const cols = Array.from({ length: 9 }, () => new Set<string>()) // [1] digits seen in each column
  const boxes = Array.from({ length: 9 }, () => new Set<string>()) // [1] digits seen in each 3x3 box
  t.step(1, 'Make 27 empty sets: 9 for rows, 9 for columns, 9 for boxes. Then scan the filled cells in reading order.', [grid(board, { label: 'board' }), buckets([{ key: 'row 0', items: [] }, { key: 'col 0', items: [] }, { key: 'box 0', items: [] }], { label: 'sets (3 of the 27 shown per cell)', keyLabel: 'digits seen' })])
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const d = board[r][c]
      if (d === '.') continue // empty cells have no digit to check
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3) // [2] which 3x3 box holds this cell
      t.step(2, `Digit ${d} at row ${r}, column ${c}. Its box is floor(${r}/3)*3 + floor(${c}/3) = ${b}. Is ${d} already in row ${r}, column ${c} or box ${b}?`, [grid(board, { label: 'board', tones: board.map((row, i) => row.map((v, j) => (i === r && j === c ? 'focus' : v !== '.' && (i < r || (i === r && j < c)) ? 'keep' : null))) }), buckets([{ key: `row ${r}`, items: [...rows[r]] }, { key: `col ${c}`, items: [...cols[c]] }, { key: `box ${b}`, items: [...boxes[b]] }], { label: 'the 3 sets for this cell', keyLabel: 'digits seen' })])
      if (rows[r].has(d) || cols[c].has(d) || boxes[b].has(d)) { // [3] seen in its row, column or box
        t.step(3, `${d} is already in ${rows[r].has(d) ? `row ${r}` : cols[c].has(d) ? `column ${c}` : `box ${b}`}. The board is invalid.`, [grid(board, { label: 'board', tones: board.map((row, i) => row.map((v, j) => (v === d && (i < r || (i === r && j <= c)) && (i === r || j === c || Math.floor(i / 3) * 3 + Math.floor(j / 3) === b) ? 'miss' : null))) }), buckets([{ key: `row ${r}`, items: [...rows[r]], tone: rows[r].has(d) ? 'miss' : undefined }, { key: `col ${c}`, items: [...cols[c]], tone: cols[c].has(d) ? 'miss' : undefined }, { key: `box ${b}`, items: [...boxes[b]], tone: boxes[b].has(d) ? 'miss' : undefined }], { label: 'the 3 sets for this cell', keyLabel: 'digits seen' })])
        return false
      }
      rows[r].add(d) // [4] remember the digit in all three sets
      cols[c].add(d)
      boxes[b].add(d)
      t.step(4, `${d} is new in all three. Add it to row ${r}, column ${c} and box ${b}.`, [grid(board, { label: 'board', tones: board.map((row, i) => row.map((v, j) => (i === r && j === c ? 'hit' : v !== '.' && (i < r || (i === r && j < c)) ? 'keep' : null))) }), buckets([{ key: `row ${r}`, items: [...rows[r]], tone: 'keep' }, { key: `col ${c}`, items: [...cols[c]], tone: 'keep' }, { key: `box ${b}`, items: [...boxes[b]], tone: 'keep' }], { label: 'the 3 sets for this cell', keyLabel: 'digits seen' })])
    }
  }
  t.step(3, 'Every filled cell passed. No digit repeats in any row, column or box. Valid.', [grid(board, { label: 'board', tones: board.map((row) => row.map((v) => (v !== '.' ? 'hit' : null))) })])
  return true // [3] nothing clashed
}
