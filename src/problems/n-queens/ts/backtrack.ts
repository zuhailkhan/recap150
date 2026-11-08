import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { buckets, grid } from '../../../core/panels'

export function solveNQueens(n: number, t: Tracer = noop): string[][] {
  const out: string[][] = []
  const queens: number[] = [] // [1] queens[r] is the column of the queen in row r
  const cols = new Set<number>() // columns that hold a queen
  const down = new Set<number>() // r - c is equal along a diagonal that runs down and to the right
  const up = new Set<number>() // r + c is equal along a diagonal that runs up and to the right
  t.step(1, `Place one queen per row on a ${n} by ${n} board, top to bottom. Three sets remember what is attacked.`, [grid(Array.from({ length: n }, () => Array<string>(n).fill('.')), { label: 'board' }), buckets([{ key: 'columns', items: [] }, { key: 'diagonals r-c', items: [] }, { key: 'diagonals r+c', items: [] }], { label: 'attacked lines', keyLabel: 'taken' })])

  function walk(r: number): void {
    if (r === n) { // [4] every row has a queen: draw the board and save it
      out.push(queens.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)))
      t.step(4, `All ${n} queens are placed and none attack each other. Save this board.`, [grid(out[out.length - 1].map((row) => row.split('')), { label: 'board', tones: out[out.length - 1].map((row) => row.split('').map((ch) => (ch === 'Q' ? 'hit' : null))) }), buckets([{ key: 'columns', items: [...cols] }, { key: 'diagonals r-c', items: [...down] }, { key: 'diagonals r+c', items: [...up] }], { label: 'attacked lines', keyLabel: 'taken' })])
      return
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || down.has(r - c) || up.has(r + c)) { // [2] this square is attacked: skip it
        t.step(2, `Row ${r}, column ${c} is attacked along ${cols.has(c) ? `column ${c}` : down.has(r - c) ? `diagonal r-c = ${r - c}` : `diagonal r+c = ${r + c}`}. Skip it.`, [grid(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (queens[i] === j ? 'Q' : '.'))), { label: 'board', tones: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === r && j === c ? 'miss' : queens[i] === j ? 'keep' : cols.has(j) || down.has(i - j) || up.has(i + j) ? 'dim' : null))) }), buckets([{ key: 'columns', items: [...cols], tone: cols.has(c) ? 'miss' : undefined }, { key: 'diagonals r-c', items: [...down], tone: down.has(r - c) ? 'miss' : undefined }, { key: 'diagonals r+c', items: [...up], tone: up.has(r + c) ? 'miss' : undefined }], { label: 'attacked lines', keyLabel: 'taken' })])
        continue
      }
      queens.push(c) // [3] place a queen and mark its column and both diagonals as attacked
      cols.add(c)
      down.add(r - c)
      up.add(r + c)
      t.step(3, `Place a queen at row ${r}, column ${c}. Column ${c}, r-c = ${r - c} and r+c = ${r + c} are now taken. Go to row ${r + 1}.`, [grid(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (queens[i] === j ? 'Q' : '.'))), { label: 'board', tones: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === r && j === c ? 'focus' : queens[i] === j ? 'keep' : cols.has(j) || down.has(i - j) || up.has(i + j) ? 'dim' : null))) }), buckets([{ key: 'columns', items: [...cols], tone: 'focus' }, { key: 'diagonals r-c', items: [...down], tone: 'focus' }, { key: 'diagonals r+c', items: [...up], tone: 'focus' }], { label: 'attacked lines', keyLabel: 'taken' })])
      walk(r + 1)
      queens.pop() // [5] remove the queen and free its column and diagonals
      cols.delete(c)
      down.delete(r - c)
      up.delete(r + c)
      t.step(5, `Remove the queen from row ${r}, column ${c}. Its column and diagonals are free again. Try the next column.`, [grid(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (queens[i] === j ? 'Q' : '.'))), { label: 'board', tones: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === r && j === c ? 'dim' : queens[i] === j ? 'keep' : cols.has(j) || down.has(i - j) || up.has(i + j) ? 'dim' : null))) }), buckets([{ key: 'columns', items: [...cols] }, { key: 'diagonals r-c', items: [...down] }, { key: 'diagonals r+c', items: [...up] }], { label: 'attacked lines', keyLabel: 'taken' })])
    }
  }

  walk(0)
  t.step(5, `Every placement was tried and removed. ${out.length} board${out.length === 1 ? '' : 's'} found.`, out.length ? [grid(out[0].map((row) => row.split('')), { label: 'first board found', tones: out[0].map((row) => row.split('').map((ch) => (ch === 'Q' ? 'hit' : null))) })] : [grid(Array.from({ length: n }, () => Array<string>(n).fill('.')), { label: 'no board works', tones: Array.from({ length: n }, () => Array<'miss'>(n).fill('miss')) })])
  return out
}
