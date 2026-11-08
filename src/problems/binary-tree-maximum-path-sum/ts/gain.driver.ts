import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { maxPathSum } from './gain'
import { build, type Levels } from './viz'

/** JSON in, JSON out: a level-order array in, the best path sum out. Forwards the tracer. */
export function maxPathSumDriver(levels: Levels, t: Tracer = noop): number {
  return maxPathSum(build(levels), t)
}
