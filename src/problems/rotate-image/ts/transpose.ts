import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid, mark2, type Tone } from '../../../core/panels'

export function rotate(matrix: number[][], t: Tracer = noop): void {
  const n = matrix.length
  t.step(1, `A ${n} by ${n} matrix. Turning it clockwise takes two moves: flip it over its main diagonal, then mirror every row.`, [grid(matrix, { label: 'matrix' })])
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      ;[matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]] // [1] transpose: swap across the diagonal
      t.step(1, `Swap (${i},${j}) with (${j},${i}). Rows become columns, one pair at a time.`, [grid(matrix, { label: 'after the swap', tones: mark2(n, n, [[i, j, 'focus'], [j, i, 'focus']]) })])
    }
  }
  for (let r = 0; r < n; r++) {
    matrix[r].reverse() // [2] reverse each row
    t.step(2, `Reverse row ${r}. Its cells now run the other way.`, [grid(matrix, { label: 'after reversing row ' + r, tones: matrix.map((row, i): (Tone | null)[] => row.map(() => (i < r ? 'hit' : i === r ? 'focus' : null))) })])
  }
}
