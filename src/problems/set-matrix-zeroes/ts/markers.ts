import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { grid, type Tone } from '../../../core/panels'
import { flags, zeroTones } from './viz'

export function setZeroes(matrix: number[][], t: Tracer = noop): void {
  const rows = matrix.length
  const cols = matrix[0].length
  const firstRow = matrix[0].includes(0) // [1] does row 0 hold a zero of its own?
  const firstCol = matrix.some((row) => row[0] === 0) // [1] does column 0?
  t.step(1, `Before row 0 and column 0 become marker space, remember if they hold a real zero. Row 0: ${firstRow ? 'yes' : 'no'}. Column 0: ${firstCol ? 'yes' : 'no'}.`, [grid(matrix, { label: 'matrix', tones: matrix.map((row, i) => row.map((v, j): Tone | null => (v === 0 && (i === 0 || j === 0) ? 'focus' : null))) }), flags(firstRow, firstCol)])
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0 // [2] a zero at (r, c) marks its row in column 0
        matrix[0][c] = 0 // [2] and its column in row 0
      }
    }
    t.step(2, `Scanned row ${r}. ${matrix[r].slice(1).includes(0) ? 'A zero here wrote a marker into column 0 and into row 0.' : 'No zero in the inside cells, so no marker.'}`, [grid(matrix, { label: 'markers are the zeros in row 0 and column 0', tones: zeroTones(matrix, r) }), flags(firstRow, firstCol)])
  }
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0 // [3] a marker for this row or column says wipe
    }
    t.step(3, `Row ${r}: any inside cell whose row marker or column marker is 0 becomes 0.`, [grid(matrix, { label: 'inside cells wiped so far', tones: zeroTones(matrix, r) }), flags(firstRow, firstCol)])
  }
  if (firstRow) {
    matrix[0].fill(0) // [4] row 0 had its own zero, so wipe it last
    t.step(4, 'Row 0 held a real zero, so the whole row becomes 0.', [grid(matrix, { label: 'matrix', tones: zeroTones(matrix, -1, true) }), flags(firstRow, firstCol, 'row')])
  }
  if (firstCol) {
    for (let r = 0; r < rows; r++) matrix[r][0] = 0 // [4] column 0 had its own zero, so wipe it last
    t.step(4, 'Column 0 held a real zero, so the whole column becomes 0.', [grid(matrix, { label: 'matrix', tones: zeroTones(matrix, -1, true) }), flags(firstRow, firstCol, 'col')])
  }
  t.step(4, 'Done. Every row and column that held a zero is now all zeros.', [grid(matrix, { label: 'result', tones: zeroTones(matrix, -1, true) })])
}
