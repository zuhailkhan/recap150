import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, grid } from '../../../core/panels'
import { fences, spiralTones } from './viz'

export function spiralOrder(matrix: number[][], t: Tracer = noop): number[] {
  const out: number[] = []
  let top = 0
  let bottom = matrix.length - 1
  let left = 0
  let right = matrix[0].length - 1
  t.step(1, `Four fences around the whole grid: top ${top}, bottom ${bottom}, left ${left}, right ${right}. Walk the outer ring, pull the fences in, repeat.`, [grid(matrix, { label: 'matrix' }), fences(top, bottom, left, right), arr(out, { label: 'path so far' })])
  while (top <= bottom && left <= right) { // [1] stop when the fences cross
    for (let c = left; c <= right; c++) out.push(matrix[top][c]) // [2] top row, left to right
    top++
    t.step(2, `Top row, left to right. Then the top fence drops to ${top}.`, [grid(matrix, { label: 'matrix', tones: spiralTones(matrix.length, matrix[0].length, [top, bottom, left, right], [top - 1, top - 1, left, right]) }), fences(top, bottom, left, right, 'top'), arr(out, { label: 'path so far' })])
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]) // [3] right column, top to bottom
    right--
    t.step(3, `Right column, going down. Then the right fence moves in to ${right}.`, [grid(matrix, { label: 'matrix', tones: spiralTones(matrix.length, matrix[0].length, [top, bottom, left, right], [top, bottom, right + 1, right + 1]) }), fences(top, bottom, left, right, 'right'), arr(out, { label: 'path so far' })])
    if (top <= bottom) { // [4] a bottom row is left only if the fences have not crossed
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]) // [4] bottom row, right to left
      bottom--
      t.step(4, `Bottom row, right to left. Then the bottom fence rises to ${bottom}.`, [grid(matrix, { label: 'matrix', tones: spiralTones(matrix.length, matrix[0].length, [top, bottom, left, right], [bottom + 1, bottom + 1, left, right]) }), fences(top, bottom, left, right, 'bottom'), arr(out, { label: 'path so far' })])
    }
    if (left <= right) { // [5] a left column is left only if the fences have not crossed
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]) // [5] left column, bottom to top
      left++
      t.step(5, `Left column, going up. Then the left fence moves in to ${left}.`, [grid(matrix, { label: 'matrix', tones: spiralTones(matrix.length, matrix[0].length, [top, bottom, left, right], [top, bottom, left - 1, left - 1]) }), fences(top, bottom, left, right, 'left'), arr(out, { label: 'path so far' })])
    }
  }
  t.step(1, `The fences have crossed, so every cell is taken. ${out.length} values in spiral order.`, [grid(matrix, { label: 'matrix', tones: spiralTones(matrix.length, matrix[0].length, [1, 0, 1, 0], null) }), arr(out, { label: 'path', tones: out.map(() => 'hit') })])
  return out
}
