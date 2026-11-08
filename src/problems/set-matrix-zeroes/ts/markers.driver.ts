import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { setZeroes } from './markers'

/** setZeroes changes the matrix in place and returns nothing, so the driver hands back the matrix itself. */
export function setZeroesDriver(matrix: number[][], t: Tracer = noop): number[][] {
  setZeroes(matrix, t)
  return matrix
}
