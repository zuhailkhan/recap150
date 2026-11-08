import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { rotate } from './transpose'

/** rotate works in place and returns nothing, so the driver hands back the matrix itself. */
export function rotateDriver(matrix: number[][], t: Tracer = noop): number[][] {
  rotate(matrix, t)
  return matrix
}
