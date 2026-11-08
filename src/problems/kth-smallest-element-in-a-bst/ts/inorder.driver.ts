import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { kthSmallest } from './inorder'
import { build, type Levels } from './viz'

/** JSON in, JSON out: a level-order array and k in, the k-th smallest value out. Forwards the tracer. */
export function kthSmallestDriver(levels: Levels, k: number, t: Tracer = noop): number {
  return kthSmallest(build(levels), k, t)
}
