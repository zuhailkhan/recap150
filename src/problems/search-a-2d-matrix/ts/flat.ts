import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, grid } from '../../../core/panels'

export function searchMatrix(matrix: number[][], target: number, t: Tracer = noop): boolean {
  const rows = matrix.length
  const cols = rows > 0 ? matrix[0].length : 0
  let l = 0 // [1] pretend the matrix is one sorted array of rows * cols items
  let r = rows * cols - 1 // [1]
  t.step(1, `Looking for ${target}. Read the ${rows} by ${cols} grid row by row as one sorted line of ${rows * cols} items.`, [grid(matrix, { label: 'matrix' }), arr(matrix.flat(), { label: 'same cells, flattened', pointers: r >= 0 ? [{ name: 'l', at: 0 }, { name: 'r', at: r }] : [], window: r >= 0 ? [0, r] : undefined })])
  while (l <= r) { // [2] something is still live: look at its middle
    const m = l + Math.floor((r - l) / 2)
    const row = Math.floor(m / cols) // [2] flat index -> row and column
    const col = m % cols
    t.step(2, `Middle is flat index ${m}. That is row ${row}, column ${col}, and it holds ${matrix[row][col]}.`, [grid(matrix, { label: 'matrix', tones: matrix.map((cells, y) => cells.map((_, x) => (y * cols + x < l || y * cols + x > r ? 'dim' : y * cols + x === m ? 'focus' : null))), pointers: [{ r: row, c: col, name: 'm', tone: 'focus' }] }), arr(matrix.flat(), { label: 'same cells, flattened', tones: matrix.flat().map((_, i) => (i < l || i > r ? 'dim' : i === m ? 'focus' : null)), pointers: [{ name: 'l', at: l }, { name: 'm', at: m, tone: 'focus' }, { name: 'r', at: r }], window: [l, r] })])
    if (matrix[row][col] === target) { // [4] found it: that is the answer
      t.step(4, `${matrix[row][col]} equals ${target}. The target is in the matrix.`, [grid(matrix, { label: 'matrix', tones: matrix.map((cells, y) => cells.map((_, x) => (y === row && x === col ? 'hit' : 'dim'))) }), arr(matrix.flat(), { label: 'same cells, flattened', tones: matrix.flat().map((_, i) => (i === m ? 'hit' : 'dim')) })])
      return true
    }
    if (matrix[row][col] < target) l = m + 1 // [3] too small: drop the middle and everything before it
    else r = m - 1 // [3] too big: drop the middle and everything after it
    t.step(3, matrix[row][col] < target ? `${matrix[row][col]} is smaller than ${target}. Drop everything up to flat index ${m}.` : `${matrix[row][col]} is bigger than ${target}. Drop everything from flat index ${m} on.`, [grid(matrix, { label: 'matrix', tones: matrix.map((cells, y) => cells.map((_, x) => (y * cols + x < l || y * cols + x > r ? 'dim' : null))) }), arr(matrix.flat(), { label: 'same cells, flattened', tones: matrix.flat().map((_, i) => (i < l || i > r ? 'dim' : null)), pointers: [{ name: 'l', at: l }, { name: 'r', at: r }].filter((p) => p.at >= 0 && p.at < rows * cols), window: l <= r ? [l, r] : undefined })])
  }
  t.step(4, `l (${l}) has passed r (${r}). Every cell was ruled out.`, [grid(matrix, { label: 'matrix', tones: matrix.map((cells) => cells.map(() => 'miss' as const)) })])
  return false // [4] the live range is empty: not found
}
